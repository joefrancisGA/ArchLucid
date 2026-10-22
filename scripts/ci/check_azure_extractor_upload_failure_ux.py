#!/usr/bin/env python3
"""Verify Azure extractor upload failure UX maps stable codes to docs and tests."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REQUIRED_SEMANTIC_CODES: tuple[str, ...] = (
    "AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION",
    "AZURE_EXTRACTOR_MISSING_MANIFEST",
    "AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE",
    "AZURE_EXTRACTOR_ZIP_TOO_LARGE",
    "AZURE_EXTRACTOR_RUN_SCOPE_MISMATCH",
)

REQUIRED_TEST_PATHS: tuple[str, ...] = (
    "archlucid-ui/src/lib/azure-extractor-upload-failure.test.ts",
    "ArchLucid.Api.Tests/AzureExtractorUploadControllerTests.cs",
    "ArchLucid.Core.Tests/AzureExtractor/AzureExtractorPackageZipValidatorTests.cs",
    "ArchLucid.Application.Tests/AzureExtractor/AzureExtractorManifestReaderTests.cs",
)

REQUIRED_DOC_MARKERS: tuple[str, ...] = (
    "schema-versioned",
    "tier 1",
    "upload",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def run_checks(root: Path) -> list[str]:
    violations: list[str] = []

    resolver = root / "archlucid-ui" / "src" / "lib" / "azure-extractor-upload-error-resolver.ts"

    if not resolver.is_file():
        violations.append("missing azure-extractor-upload-error-resolver.ts")
    else:
        text = resolver.read_text(encoding="utf-8", errors="replace")

        for code in REQUIRED_SEMANTIC_CODES:
            if code not in text:
                violations.append(f"resolver missing semantic code {code}")

    for rel in REQUIRED_TEST_PATHS:
        if not (root / rel).is_file():
            violations.append(f"missing extractor failure test file: {rel}")

    doc = root / "docs" / "library" / "AZURE_EXTRACTOR.md"

    if not doc.is_file():
        violations.append("missing docs/library/AZURE_EXTRACTOR.md")
    else:
        doc_text = doc.read_text(encoding="utf-8", errors="replace").lower()

        for marker in REQUIRED_DOC_MARKERS:
            if marker.lower() not in doc_text:
                violations.append(f"AZURE_EXTRACTOR.md missing marker: {marker}")

    ingest = root / "docs" / "runbooks" / "AZURE_EXTRACTOR_INGEST.md"

    if not ingest.is_file():
        violations.append("missing docs/runbooks/AZURE_EXTRACTOR_INGEST.md")

    ui_failure = root / "archlucid-ui" / "src" / "lib" / "azure-extractor-upload-failure.ts"

    if ui_failure.is_file():
        ui_text = ui_failure.read_text(encoding="utf-8", errors="replace")

        if "resolveAzureExtractorUploadError" not in ui_text:
            violations.append("azure-extractor-upload-failure.ts must call resolveAzureExtractorUploadError")

        if not re.search(r"docPath", ui_text):
            violations.append("azure-extractor-upload-failure.ts must surface docPath guidance")

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Azure extractor upload failure UX coverage.")
    parser.add_argument("--markdown-out", type=Path, default=None)
    args = parser.parse_args()

    root = repo_root()
    violations = run_checks(root)
    disposition = "PASS" if not violations else "HOLD"

    if args.markdown_out is not None:
        lines = [
            "# Azure extractor upload failure UX acceptance",
            "",
            f"Disposition: **{disposition}**",
            "",
        ]

        if violations:
            lines.append("## Violations")
            lines.append("")
            lines.extend(f"- {item}" for item in violations)
        else:
            lines.append("Stable semantic codes, UI resolver, API/core tests, and operator docs are aligned.")

        args.markdown_out.expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text("\n".join(lines) + "\n", encoding="utf-8")

    if violations:
        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("check_azure_extractor_upload_failure_ux: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
