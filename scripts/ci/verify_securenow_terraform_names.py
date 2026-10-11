#!/usr/bin/env python3
"""Verify that the checked-in UHG SecureNow example has product-owned names."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--vars-file",
        type=Path,
        default=Path("infra/terraform-securenow-in-tenant/terraform.tfvars.example"),
    )
    arguments = parser.parse_args()
    vars_file = arguments.vars_file

    if not vars_file.is_file():
        print(f"Missing Terraform example: {vars_file}", file=sys.stderr)
        return 2

    content = vars_file.read_text(encoding="utf-8")
    edition_match = re.search(r"(?m)^\s*edition\s*=\s*\"([^\"]+)\"", content)
    if edition_match is None:
        print("The Terraform example must declare edition.", file=sys.stderr)
        return 2

    if edition_match.group(1).strip().lower() == "uhg" and re.search(
        r"archlucid", content, re.IGNORECASE
    ):
        print(
            "UHG SecureNow Terraform names must not contain archlucid.",
            file=sys.stderr,
        )
        return 1

    print(f"OK: {vars_file} contains no ArchLucid name for edition {edition_match.group(1)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
