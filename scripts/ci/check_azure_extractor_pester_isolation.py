#!/usr/bin/env python3
"""Keep Get-ArchLucidAzurePackage Pester isolated from companion/AlBug suites."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_CI_REL = ".github/workflows/ci.yml"
_GET_JOB = "azure-extractor-pester"
_EXTENDED_JOB = "azure-extractor-pester-extended"
_SKIP_AZ = "ARCHLUCID_EXTRACTOR_SKIP_AZ_CLI_SYNC"
_GET_TEST = "Get-ArchLucidAzurePackage.Tests.ps1"
_ALBUG = "AlBugPickZone.Tests.ps1"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def extract_yaml_job_block(text: str, job_marker: str) -> str | None:
    match = re.search(rf"^  {re.escape(job_marker)}:\s*$", text, re.MULTILINE)

    if match is None:
        return None

    start = match.start()
    next_job = re.search(r"^  [a-zA-Z0-9_-]+:\s*$", text[match.end() :], re.MULTILINE)

    if next_job is None:
        return text[start:]

    return text[start : match.end() + next_job.start()]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    path = repo_root() / _CI_REL
    errors: list[str] = []

    if not path.is_file():
        print(f"missing {_CI_REL}", file=sys.stderr)
        return 1

    text = path.read_text(encoding="utf-8", errors="replace")
    get_job = extract_yaml_job_block(text, _GET_JOB)
    extended_job = extract_yaml_job_block(text, _EXTENDED_JOB)

    if get_job is None:
        errors.append(f"{_CI_REL}: missing job {_GET_JOB}")
    else:
        if _GET_TEST not in get_job:
            errors.append(f"{_GET_JOB}: must run {_GET_TEST}")

        if _ALBUG in get_job:
            errors.append(
                f"{_GET_JOB}: must not run {_ALBUG} "
                "(companion/AlBug suites belong in azure-extractor-pester-extended)",
            )

        if _SKIP_AZ not in get_job:
            errors.append(f"{_GET_JOB}: must set {_SKIP_AZ}=1 so CI never calls real az")

    if extended_job is None:
        errors.append(f"{_CI_REL}: missing job {_EXTENDED_JOB}")
    else:
        if _ALBUG not in extended_job:
            errors.append(f"{_EXTENDED_JOB}: must run {_ALBUG}")

        if "Run-ArchLucidAzureExtractor.Tests.ps1" not in extended_job:
            errors.append(f"{_EXTENDED_JOB}: must run Run-ArchLucidAzureExtractor.Tests.ps1")

        if _SKIP_AZ not in extended_job:
            errors.append(f"{_EXTENDED_JOB}: must set {_SKIP_AZ}=1")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_azure_extractor_pester_isolation: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
