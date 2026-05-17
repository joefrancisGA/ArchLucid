"""One-off helper: synthesize docs/REPOSITORY_README.md from repo README.md."""
from __future__ import annotations

import re
from pathlib import Path

LINK = re.compile(r"\]\(([^)]+)\)")


def rewrite_one(target: str) -> str | None:
    if target.startswith(("http://", "https://")):
        return None

    suffix: str = ""
    if "#" in target:
        prefix, suffix = target.split("#", 1)
        suffix = "#" + suffix
        work = prefix
    else:
        work = target

    if work.startswith("docs/"):
        return work[len("docs/") :] + suffix

    if work.startswith("schemas/"):
        return "../schemas/" + work[len("schemas/") :] + suffix

    if work.startswith("archlucid-ui/"):
        return "../archlucid-ui/" + work[len("archlucid-ui/") :] + suffix

    if work == "global.json":
        return "../global.json" + suffix

    if work == "docker-compose.yml":
        return "../docker-compose.yml" + suffix

    if work == "BREAKING_CHANGES.md":
        return "../BREAKING_CHANGES.md" + suffix

    return None


def replace_links(text: str) -> str:

    def rf(match: re.Match[str]) -> str:
        rewritten = rewrite_one(match.group(1))
        if rewritten is None:
            return match.group(0)
        return "](" + rewritten + ")"

    return LINK.sub(rf, text)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    raw = root.joinpath("README.md").read_text(encoding="utf-8")
    lines = raw.splitlines()
    if lines and lines[0].startswith("<!-- **Scope:**"):
        body = "\n".join(lines[1:]).lstrip("\n")
    else:
        body = raw

    scope_lines = (
        "> **Scope:** Full repository overview, install spine, product layers, API and CLI semantics,"
        " and buyer-vs-engineering boundaries; GitHub landing is the stub README at repo root."
        "\n>\n"
    )
    out_text = replace_links(scope_lines + body)
    root.joinpath("docs/REPOSITORY_README.md").write_text(out_text, encoding="utf-8")


if __name__ == "__main__":
    main()
