#!/usr/bin/env python3
"""Validate the book's Terraform listings with the real providers.

Two kinds of listing live under ``lab/listings/terraform``:

- A **snippet** (``*.tf`` directly in that folder) is a change to the companion lab. Each one is
  checked inside a temporary copy of ``lab/terraform``. A snippet block that redeclares a lab
  resource, such as ``azurerm_storage_account.custdata`` with one changed argument, goes into a
  Terraform override file (``*_override.tf``), which merges its arguments into the lab's block.
  Every other block goes into an ordinary ``.tf`` file. Each snippet is validated on its own.
- A **standalone module** (a subfolder) is a complete root module and is validated as it stands.

Every listing must also pass ``terraform fmt -check``. Nothing is planned or applied, so no Azure
credentials are needed; ``terraform init`` does need the providers, from the registry or a plugin
cache (set ``TF_PLUGIN_CACHE_DIR`` to avoid downloading them on every run).

Usage: python docs/book/tools/check_terraform_listings.py [--terraform PATH] [--book-root docs/book]
Exit 0 when every listing validates, 1 otherwise. Standard library only.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections.abc import Callable
from pathlib import Path

BOOK_ROOT = Path(__file__).resolve().parents[1]
LAB_MODULE = Path("lab") / "terraform"
LISTINGS = Path("lab") / "listings" / "terraform"
LOCK_FILE = ".terraform.lock.hcl"
# Opening line of a top-level block whose address can collide with the lab: resource "type" "name" {
ADDRESSED_BLOCK = re.compile(r'^(?P<kind>resource|data)\s+"(?P<type>[^"]+)"\s+"(?P<name>[^"]+)"\s*\{')

Runner = Callable[[list[str], Path, dict[str, str]], tuple[int, str]]


class Block:
    """One top-level HCL block, with the comment lines directly above it."""

    def __init__(self, address: tuple[str, str, str] | None, lines: list[str]) -> None:
        self.address = address
        self.lines = lines


def is_comment_or_blank(line: str) -> bool:
    stripped = line.strip()

    return not stripped or stripped.startswith(("#", "//"))


def block_address(line: str) -> tuple[str, str, str] | None:
    """(kind, type, name) for a resource or data block's opening line, else None."""
    match = ADDRESSED_BLOCK.match(line)

    return (match.group("kind"), match.group("type"), match.group("name")) if match else None


def split_blocks(text: str) -> list[Block]:
    """Top-level blocks of ``terraform fmt``-formatted HCL, where every block closes with '}' in column 0.

    Comment lines attach to the block below them; comments after the last block are dropped.
    Raises ValueError for a top-level line that is neither a comment nor a block opening.
    """
    blocks: list[Block] = []
    pending: list[str] = []
    current: list[str] | None = None

    for number, line in enumerate(text.splitlines(), start=1):
        if current is not None:
            current.append(line)

            if line.rstrip() == "}":
                blocks.append(Block(block_address(current[0]), pending + current))
                pending, current = [], None

            continue

        if is_comment_or_blank(line):
            pending.append(line)
            continue

        if line.rstrip().endswith("{}"):
            blocks.append(Block(block_address(line), pending + [line]))
            pending = []
            continue

        if not line.rstrip().endswith("{"):
            raise ValueError(f"line {number}: expected a block opening or a comment, found {line!r}")

        current = [line]

    if current is not None:
        raise ValueError(f"unterminated block starting {current[0]!r}")

    return blocks


def declared_addresses(module: Path) -> set[tuple[str, str, str]]:
    """Every resource and data address declared in a module's top-level .tf files."""
    return {address
            for path in module.glob("*.tf")
            for address in (block_address(line) for line in path.read_text(encoding="utf-8").splitlines())
            if address is not None}


def partition(blocks: list[Block], existing: set[tuple[str, str, str]]) -> tuple[str, str]:
    """(new blocks, override blocks) as file text; a block overrides when the module already declares it."""
    def joined(selected: list[Block]) -> str:
        return "\n".join("\n".join(block.lines) for block in selected) + "\n" if selected else ""

    overrides = [block for block in blocks if block.address in existing]
    additions = [block for block in blocks if block.address not in existing]

    return joined(additions), joined(overrides)


def stage_snippet(snippet: Path, lab_module: Path, work: Path) -> None:
    """Copy the lab module into ``work`` and add the snippet as new and override files."""
    work.mkdir(parents=True, exist_ok=True)

    for source in [*lab_module.glob("*.tf"), lab_module / LOCK_FILE]:
        if source.is_file():
            shutil.copy2(source, work / source.name)

    additions, overrides = partition(split_blocks(snippet.read_text(encoding="utf-8")),
                                     declared_addresses(lab_module))

    if additions:
        (work / f"listing_{snippet.stem}.tf").write_text(additions, encoding="utf-8")

    if overrides:
        (work / f"listing_{snippet.stem}_override.tf").write_text(overrides, encoding="utf-8")


def run_command(command: list[str], cwd: Path, env: dict[str, str]) -> tuple[int, str]:
    completed = subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True, check=False)

    return completed.returncode, completed.stdout + completed.stderr


def validate(terraform: str, work: Path, data_dir: Path, runner: Runner) -> str | None:
    """None when init and validate succeed in ``work``, otherwise the failing step's output."""
    # TF_DATA_DIR keeps .terraform outside the copy, so snippets sharing a lock file install providers once.
    env = {**os.environ, "TF_DATA_DIR": str(data_dir), "TF_IN_AUTOMATION": "1"}

    for step in (["init", "-backend=false", "-input=false", "-no-color"], ["validate", "-no-color"]):
        code, output = runner([terraform, *step], work, env)

        if code != 0:
            return f"terraform {step[0]} failed:\n{output.strip()}"

    return None


def snippets(book_root: Path) -> list[Path]:
    return sorted((book_root / LISTINGS).glob("*.tf"))


def standalone_modules(book_root: Path) -> list[Path]:
    return sorted(path for path in (book_root / LISTINGS).iterdir() if path.is_dir())


def check_snippet(snippet: Path, book_root: Path, scratch: Path, terraform: str, runner: Runner) -> list[str]:
    work = scratch / snippet.stem

    try:
        stage_snippet(snippet, book_root / LAB_MODULE, work)
    except ValueError as error:
        return [f"{snippet.name}: {error}"]

    failure = validate(terraform, work, scratch / ".lab-data", runner)

    return [f"{snippet.name}: {failure}"] if failure else []


def check_module(module: Path, scratch: Path, terraform: str, runner: Runner) -> list[str]:
    work = scratch / module.name
    shutil.copytree(module, work)
    failure = validate(terraform, work, scratch / f".{module.name}-data", runner)

    return [f"{module.name}/: {failure}"] if failure else []


def check_format(book_root: Path, terraform: str, runner: Runner) -> list[str]:
    listings = book_root / LISTINGS
    # No -diff: it shells out to a 'diff' executable that Windows doesn't have. fmt lists the files instead.
    code, output = runner([terraform, "fmt", "-check", "-recursive", "-no-color", str(listings)],
                          listings, dict(os.environ))

    return [] if code == 0 else [f"terraform fmt -check failed for:\n{output.strip()}"]


def main(argv: list[str] | None = None, runner: Runner = run_command) -> int:
    parser = argparse.ArgumentParser(description="Validate the book's Terraform listings.")
    parser.add_argument("--terraform", default="terraform", help="Path to the terraform executable.")
    parser.add_argument("--book-root", type=Path, default=BOOK_ROOT)
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    book_root = args.book_root.resolve()
    problems = check_format(book_root, args.terraform, runner)
    count = 0

    with tempfile.TemporaryDirectory(prefix="book-tf-") as temporary:
        scratch = Path(temporary)

        for snippet in snippets(book_root):
            count += 1
            problems += check_snippet(snippet, book_root, scratch, args.terraform, runner)

        for module in standalone_modules(book_root):
            count += 1
            problems += check_module(module, scratch, args.terraform, runner)

    for problem in problems:
        print(problem)

    print(f"check_terraform_listings: {count} listing(s), {len(problems)} problem(s)")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
