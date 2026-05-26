#!/usr/bin/env python3
"""Validate customer Tier-2 WIF templates (Terraform + Bicep) without Azure credentials."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
TERRAFORM_DIR = REPO_ROOT / "deploy" / "customer-templates" / "terraform"
BICEP_FILE = REPO_ROOT / "deploy" / "customer-templates" / "bicep" / "main.bicep"


def _run(command: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
    )


def _tool_on_path(name: str) -> bool:
    return shutil.which(name) is not None


def validate_terraform() -> tuple[str, int]:
    if not _tool_on_path("terraform"):
        return ("SKIP terraform: CLI not on PATH", 0)

    fmt = _run(["terraform", "fmt", "-check", "-recursive", "."], cwd=TERRAFORM_DIR)

    if fmt.returncode != 0:
        return (f"FAIL terraform fmt -check:\n{fmt.stdout}\n{fmt.stderr}", 1)

    init = _run(["terraform", "init", "-backend=false"], cwd=TERRAFORM_DIR)

    if init.returncode != 0:
        return (f"FAIL terraform init:\n{init.stdout}\n{init.stderr}", 1)

    validate = _run(["terraform", "validate"], cwd=TERRAFORM_DIR)

    if validate.returncode != 0:
        return (f"FAIL terraform validate:\n{validate.stdout}\n{validate.stderr}", 1)

    return ("OK terraform fmt + validate", 0)


def validate_bicep() -> tuple[str, int]:
    if _tool_on_path("az"):
        build = _run(["az", "bicep", "build", "--file", str(BICEP_FILE)])

        if build.returncode == 0:
            return ("OK az bicep build", 0)

        return (f"FAIL az bicep build:\n{build.stdout}\n{build.stderr}", 1)

    if _tool_on_path("bicep"):
        build = _run(["bicep", "build", str(BICEP_FILE)])

        if build.returncode == 0:
            return ("OK bicep build", 0)

        return (f"FAIL bicep build:\n{build.stdout}\n{build.stderr}", 1)

    return ("SKIP bicep: neither az nor bicep CLI on PATH", 0)


def main() -> int:
    messages: list[str] = []
    exit_code = 0

    for label, validator in (("terraform", validate_terraform), ("bicep", validate_bicep)):
        message, code = validator()
        messages.append(f"[{label}] {message}")

        if code != 0:
            exit_code = code

    print("\n".join(messages))

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
