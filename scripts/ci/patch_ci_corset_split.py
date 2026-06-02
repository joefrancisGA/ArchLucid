#!/usr/bin/env python3
"""One-shot patch for .github/workflows/ci.yml: guards-pre-corset + slim corset + artifacts job."""

from __future__ import annotations

import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _line_index(lines: list[str], pattern: str, start: int = 0) -> int:
    for i in range(start, len(lines)):
        if pattern in lines[i]:
            return i

    raise ValueError(f"pattern not found: {pattern!r} (from line {start + 1})")


def _job_bounds(lines: list[str], job_key: str) -> tuple[int, int]:
    start = _line_index(lines, f"  {job_key}:")
    end = len(lines)

    for i in range(start + 1, len(lines)):
        if lines[i].startswith("  ") and not lines[i].startswith("    ") and lines[i].rstrip().endswith(":"):
            end = i
            break

    return start, end


def _replace_header_comments(lines: list[str]) -> None:
    if any("Tier 0.9" in line and "guards-pre-corset" in line for line in lines):
        return

    tier1_idx = next(
        (
            i
            for i, line in enumerate(lines)
            if line.startswith("#   Tier 1") and "fast core" in line and "CycloneDX" in line
        ),
        None,
    )
    if tier1_idx is None:
        return

    lines[tier1_idx : tier1_idx + 1] = [
        "#   Tier 0.9 \u2014 guards-pre-corset (text/Python guards; no solution build)\n",
        "#   Tier 1 \u2014 .NET fast core (corset): restore, build, Suite=Core tests (SBOM/coverage HTML in Tier 1.0)\n",
        "#   Tier 1.0 \u2014 dotnet-fast-core-artifacts (full CI): CycloneDX SBOM + ReportGenerator from corset Cobertura\n",
    ]

    pr_idx = next(i for i, line in enumerate(lines) if line.startswith("# PR (main/master):"))
    if "Tier 1.0 artifacts" in lines[pr_idx]:
        return

    lines[pr_idx : pr_idx + 2] = [
        "# PR (main/master): Tier 0\u20130.9 + trimmed `dotnet-fast-core` (no Tier 1.0 artifacts, no coverlet, no finding-engine template).\n",
        "# Full CI: `dotnet-fast-core-artifacts` after corset. Jobs after corset: **workflow_dispatch** only (except PR corset path).\n",
    ]


GUARDS_JOB = """\
  guards-pre-corset:
    name: "CI: guards pre-corset (text)"
    needs:
      - gitleaks
      - doc-markdown-links
      - demo-workspaces-fixture-parity
      - openapi-contract-snapshot
      - terraform-advisory-snippets-validate
      - iac-parity-scan
      - terraform-validate-private
      - terraform-validate-public-stacks
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Fetch default branch for diff guards (manual CI)
        if: github.event_name == 'workflow_dispatch'
        run: git fetch origin "${{ github.event.repository.default_branch }}" --no-tags

      - name: Set git diff range (PR)
        if: github.event_name == 'pull_request'
        run: echo "ARCHLUCID_GIT_DIFF_RANGE=${{ github.event.pull_request.base.sha }}...${{ github.event.pull_request.head.sha }}" >> "$GITHUB_ENV"

      - name: Set git diff range (push)
        if: github.event_name == 'push'
        run: echo "ARCHLUCID_GIT_DIFF_RANGE=${{ github.event.before }}...${{ github.event.after }}" >> "$GITHUB_ENV"

      - name: Set git diff range (workflow_dispatch)
        if: github.event_name == 'workflow_dispatch'
        run: echo "ARCHLUCID_GIT_DIFF_RANGE=origin/${{ github.event.repository.default_branch }}...HEAD" >> "$GITHUB_ENV"

      - name: Run pre-corset guards
        env:
          ARCHLUCID_GIT_REPO_ROOT: ${{ github.workspace }}
        run: bash scripts/ci/run_guards_pre_corset.sh

"""

ARTIFACTS_JOB = """\
  dotnet-fast-core-artifacts:
    name: ".NET: fast core artifacts (SBOM + coverage HTML)"
    needs: dotnet-fast-core
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v5

      - name: Setup .NET
        uses: actions/setup-dotnet@v5.2.0
        with:
          global-json-file: global.json
          cache: true
          cache-dependency-path: |
            Directory.Packages.props
            global.json
            **/*.csproj

      - name: Restore (SBOM)
        run: dotnet restore ArchLucid.Api/ArchLucid.Api.csproj

      - uses: actions/download-artifact@v6
        with:
          name: coverage-fast-core
          path: ${{ runner.temp }}/coverage-fast-core

      - name: SBOM and coverage HTML
        run: bash scripts/ci/run_dotnet_fast_core_artifacts.sh

      - uses: actions/upload-artifact@v6
        with:
          name: sbom-dotnet
          path: sbom-dotnet.json

      - uses: actions/upload-artifact@v6
        with:
          name: coverage-report-fast-core-html
          path: ${{ runner.temp }}/coverage-report-fast-core/**
          if-no-files-found: warn

"""


def main() -> int:
    path = _repo_root() / ".github" / "workflows" / "ci.yml"
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    _replace_header_comments(lines)

    text = "".join(lines)
    if "  guards-pre-corset:" not in text:
        insert_at = _line_index(lines, "  dotnet-fast-core:")
        lines[insert_at:insert_at] = [GUARDS_JOB]

    corset_start, corset_end = _job_bounds(lines, "dotnet-fast-core")
    needs_guard = "      - guards-pre-corset\n"
    if needs_guard not in "".join(lines[corset_start:corset_end]):
        stacks_idx = _line_index(lines, "      - terraform-validate-public-stacks", corset_start)
        lines.insert(stacks_idx + 1, needs_guard)

    for i in range(corset_start, corset_end):
        if lines[i].strip() == "timeout-minutes: 90":
            lines[i] = "    timeout-minutes: 60\n"
            break

    try:
        guard_start = _line_index(lines, "audit coverage matrix vs AuditEventTypes", corset_start) - 1
        prompt_idx = _line_index(lines, "# Prompt-injection executable regression", corset_start)
        del lines[guard_start:prompt_idx]
    except ValueError:
        pass

    corset_start, corset_end = _job_bounds(lines, "dotnet-fast-core")
    try:
        sbom_idx = _line_index(lines, "Generate .NET SBOM", corset_start)
        finding_idx = _line_index(lines, "finding-engine template", corset_start)
        del lines[sbom_idx:finding_idx]
    except ValueError:
        pass

    corset_start, corset_end = _job_bounds(lines, "dotnet-fast-core")
    try:
        merge_idx = _line_index(lines, "Merge coverage (HTML + GitHub job summary)", corset_start)
        html_upload_end = _line_index(lines, "name: coverage-report-fast-core-html", corset_start)
        while html_upload_end < len(lines) and "if-no-files-found" not in lines[html_upload_end]:
            html_upload_end += 1

        del lines[merge_idx : html_upload_end + 1]
    except ValueError:
        pass

    if "  dotnet-fast-core-artifacts:" not in "".join(lines):
        corset_start, corset_end = _job_bounds(lines, "dotnet-fast-core")
        lines[corset_end:corset_end] = [ARTIFACTS_JOB]

    corset_start, corset_end = _job_bounds(lines, "dotnet-fast-core")
    cobertura_block = (
        "      - uses: actions/upload-artifact@v6\n"
        "        if: github.event_name != 'pull_request'\n"
        "        with:\n"
        "          name: coverage-fast-core\n"
        "          path: ${{ runner.temp }}/coverage-fast-core/**/coverage.cobertura.xml\n"
        "          if-no-files-found: warn\n"
    )
    if cobertura_block not in "".join(lines[corset_start:corset_end]):
        for i in range(corset_start, corset_end):
            if "results-directory" in lines[i] and "coverage-fast-core" in lines[i]:
                lines.insert(i + 1, "\n" + cobertura_block)
                break
        else:
            raise ValueError("corset coverage test step not found for cobertura upload")

    path.write_text("".join(lines), encoding="utf-8", newline="\n")
    print(f"Patched {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
