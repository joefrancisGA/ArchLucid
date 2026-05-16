#!/usr/bin/env python3
"""Emit docs/COVERAGE_GAP_ANALYSIS.md from a merged Cobertura.xml (ReportGenerator output)."""

from __future__ import annotations

import argparse
import datetime
import sys
from collections import defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET

_CI_DIR = Path(__file__).resolve().parent
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from coverage_cobertura import is_product_archlucid_package


def local_name(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


# Packages omitted from gap-analysis tables only. Mirror coverage.runsettings when a host assembly
# still appears in merged Cobertura until the next full merge (e.g. stale shards).
_GAP_ANALYSIS_OMIT_PACKAGES: frozenset[str] = frozenset(
    {
        "ArchLucid.Worker",  # Program.cs excluded via ExcludeByFile in coverage.runsettings
    }
)

# Classes below this line-rate threshold are listed in the full gap table per assembly.
_GAP_CLASS_LINE_RATE_THRESHOLD = 0.95

# Large assembly: keep summary table sorted by line rate, but emit per-class sections near the doc bottom.
_DECISIONING_PACKAGE = "ArchLucid.Decisioning"


def _per_assembly_emit_order(
    packages: list[tuple[str, float, int, list[tuple[str, str, float, int, int]]]],
) -> list[tuple[str, float, int, list[tuple[str, str, float, int, int]]]]:
    """Line-rate order for summary table; detail sections move Decisioning after other <100% assemblies."""

    decisioning = next((p for p in packages if p[0] == _DECISIONING_PACKAGE), None)
    others = [p for p in packages if p[0] != _DECISIONING_PACKAGE]
    below_full = [p for p in others if p[1] < 1.0]
    full_line = [p for p in others if p[1] >= 1.0]

    ordered = list(below_full)

    if decisioning is not None:
        ordered.append(decisioning)

    ordered.extend(full_line)

    return ordered


def is_target_product_package(name: str) -> bool:
    if not is_product_archlucid_package(name):
        return False
    if "Benchmark" in name:
        return False
    if name in _GAP_ANALYSIS_OMIT_PACKAGES:
        return False
    return True


def _aggregate_lines_coverable_and_uncovered(lines_parent: ET.Element) -> tuple[int, int]:
    """Coverable vs uncovered `<line>` rows under Cobertura's class-level aggregate `<lines>` block."""
    coverable = 0
    uncovered = 0

    for child in lines_parent:
        if local_name(child.tag) != "line":
            continue

        if child.get("number") is None:
            continue

        coverable += 1
        hits_raw = child.get("hits")

        if hits_raw is None:
            continue

        try:
            if int(hits_raw) == 0:
                uncovered += 1
        except ValueError:
            pass

    return coverable, uncovered


def class_coverage_rows(package_el: ET.Element) -> list[tuple[str, str, float, int, int]]:
    """Per Cobertura `<class>`: type name, filename, line-rate, coverable lines, uncovered lines.

    Multiple `<class>` nodes for the same (name, file) (e.g. partial types) merge counts; line-rate is recomputed.
    """
    coverable_acc: dict[tuple[str, str], int] = defaultdict(int)
    uncovered_acc: dict[tuple[str, str], int] = defaultdict(int)

    for element in package_el.iter():
        if local_name(element.tag) != "class":
            continue

        type_name = (element.get("name") or "").strip() or "(unnamed type)"
        fn = (element.get("filename") or "").strip()

        for child in element:
            if local_name(child.tag) != "lines":
                continue

            cov_n, unc_n = _aggregate_lines_coverable_and_uncovered(child)
            key = (type_name, fn)
            coverable_acc[key] += cov_n
            uncovered_acc[key] += unc_n

    rows: list[tuple[str, str, float, int, int]] = []

    for key, cov_lines in coverable_acc.items():
        if cov_lines <= 0:
            continue

        unc_lines = uncovered_acc[key]
        line_rate = float(cov_lines - unc_lines) / float(cov_lines)
        rows.append((key[0], key[1], line_rate, cov_lines, unc_lines))

    return rows


def _class_short_name(full_type_name: str) -> str:
    parts = full_type_name.split(".")
    return parts[-1] if parts else full_type_name


def prior_coverage_attempt_hint(full_type_name: str, recent_coverage_notes_lower: str) -> str:
    """Heuristic: `COVERAGE_GAP_ANALYSIS_RECENT.md` substring match on full name or short name."""
    if not recent_coverage_notes_lower:
        return "No"

    lowered_full = full_type_name.lower()

    if lowered_full in recent_coverage_notes_lower:
        return "Yes"

    short = _class_short_name(full_type_name)

    # Avoid noisy hits on tiny identifiers (e.g. `Program`).
    if len(short) >= 8 and short.lower() in recent_coverage_notes_lower:
        return "Yes"

    return "No"


def _markdown_table_class_cell(full_type_name: str) -> str:
    """Pipe-table safe cell for Cobertura type names (generics may contain backticks like `` `1 ``)."""
    if "`" not in full_type_name:
        return f"`{full_type_name}`"

    escaped = (
        full_type_name.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("|", "&#124;")
    )

    return f"<code>{escaped}</code>"


def _emit_class_gap_markdown_rows(
    out_lines: list[str],
    ranked: list[tuple[str, str, float, int, int]],
    repo: Path,
    recent_lower: str,
) -> None:
    out_lines.append(
        "| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |"
    )
    out_lines.append("|------|-------|------|-----------------|-----------------|----------------|")

    for i, (cls, path, lr, cov_n, unc_n) in enumerate(ranked, start=1):
        rel = _rel_path_for_doc(repo, path)
        attempt = prior_coverage_attempt_hint(cls, recent_lower)
        cls_cell = _markdown_table_class_cell(cls)
        out_lines.append(
            f"| {i} | {cls_cell} | `{rel}` | {lr * 100.0:.2f} | {unc_n} | {attempt} |"
        )


def _resolve_cobertura(repo: Path, cobertura_arg: str | None) -> Path:
    if cobertura_arg:
        cob = Path(cobertura_arg)
        return cob.resolve() if cob.is_absolute() else (repo / cob).resolve()
    default = repo / "coverage-gap-1a" / "merged" / "Cobertura.xml"
    return default.resolve()


def _rel_path_for_doc(repo: Path, filepath: str) -> Path:
    """Prefer repo-relative paths; strip legacy clone prefixes (e.g. pre-rename `ArchiForge`)."""
    p = Path(filepath.strip())
    try:
        return p.relative_to(repo)
    except ValueError:
        pass
    normalized = filepath.replace("\\", "/")
    idx = normalized.find("/ArchLucid.")
    if idx >= 0:
        tail = normalized[idx + 1 :]
        return Path(tail.replace("/", "\\"))
    return p


def _dataset_note_text(cobertura: Path, repo: Path) -> str:
    """UTC mtime and path so readers can detect stale merges vs narrative bullets."""
    rel = cobertura
    try:
        rel_str = cobertura.relative_to(repo)
    except ValueError:
        rel_str = cobertura
    try:
        mtime = cobertura.stat().st_mtime
        stamp = datetime.datetime.fromtimestamp(mtime, tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    except OSError:
        stamp = "(mtime unavailable)"
    return (
        f"**Data source:** `{rel_str}` (file mtime **{stamp}**). "
        "For CI gate parity, prefer the **`coverage-merged-cobertura`** artifact from job **`.NET: merge coverage + gates`** "
        "(copy **`Cobertura.xml`** and run **`python scripts/ci/coverage_gap_analysis.py --cobertura <path>`**). "
        "See **`docs/COVERAGE_GAP_ANALYSIS.md`** — local merges without **`ARCHLUCID_SQL_TEST`** under-count SQL-only paths."
    )


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--cobertura",
        metavar="PATH",
        default=None,
        help="Merged Cobertura.xml (default: coverage-gap-1a/merged/Cobertura.xml under repo root).",
    )
    args = parser.parse_args()

    cobertura = _resolve_cobertura(repo, args.cobertura)
    if not cobertura.is_file():
        print(f"Missing merged Cobertura: {cobertura}", file=sys.stderr)
        return 2

    tree = ET.parse(cobertura)
    root = tree.getroot()
    if root is None:
        return 3

    recent_path = repo / "docs" / "COVERAGE_GAP_ANALYSIS.md"
    recent_notes_lower = ""

    packages: list[tuple[str, float, int, list[tuple[str, str, float, int, int]]]] = []

    for pkg in root.iter():
        if local_name(pkg.tag) != "package":
            continue

        name = (pkg.get("name") or "").strip()

        if not name or not is_target_product_package(name):
            continue

        lr_raw = pkg.get("line-rate")

        if lr_raw is None:
            continue

        line_rate = float(lr_raw)
        class_rows = class_coverage_rows(pkg)
        # Total coverable lines: count all line elements with hits
        total_lines = 0

        for element in pkg.iter():
            if local_name(element.tag) != "line":
                continue

            if element.get("number") is not None:
                total_lines += 1

        if total_lines == 0:
            continue

        packages.append((name, line_rate, total_lines, class_rows))

    packages.sort(key=lambda t: t[1])

    out_lines: list[str] = [
        "> **Scope:** Coverage gap analysis (merged Cobertura) - tables from the Cobertura file named under **Data source**; "
        "stale or partial local merges (or leftover shards under `coverage-gap-1a`) produce misleading percentages — clean the "
        "folder before `dotnet test` or use the CI **`coverage-merged-cobertura`** artifact.",
        ">",
        "> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). "
        "Read this file only if you have a specific reason beyond those five entry documents.",
        "",
        "# Coverage gap analysis (merged Cobertura)",
        "",
        "## Objective",
        "",
        "Describe how **line/branch coverage** is collected in CI, how to reproduce reports locally, and interpret trends vs CI gates.",
        "",
        "## Recommended workflow: Persistence and strict gates (CI-first)",
        "",
        "**Merged line / branch / per-package floors** (including **`ArchLucid.Persistence`** at **≥ 63%** line for its assembly) are enforced **only** in GitHub Actions on the merged Cobertura from the full solution test run with SQL — job id **`dotnet-full-regression`**, display name **`.NET: full regression (SQL)`** in **`.github/workflows/ci.yml`**. That job sets **`ARCHLUCID_SQL_TEST`**, runs **`dotnet test ArchLucid.sln`** with **`coverage.runsettings`**, merges reports, then runs **`scripts/ci/assert_merged_line_coverage_min.py`**. **Treat that result and the uploaded artifact `coverage-merged-cobertura` (`Cobertura.xml`) as authoritative** when debugging a red coverage gate.",
        "",
        "**Local default (fast iteration).** When adding **`ArchLucid.Persistence.Tests`**, verify behavior without Coverlet so runs stay short:",
        "",
        "- **Cross-platform:** `scripts/ci/test-persistence-local-fast.sh`",
        "- **Windows:** `scripts/ci/test-persistence-local-fast.ps1`",
        "",
        "Or manually:",
        "",
        "```bash",
        "dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj -c Release",
        "```",
        "",
        "Many SQL-backed tests **skip** unless **`ARCHLUCID_SQL_TEST`** points at a reachable database (same idea as CI). A green local **InMemory-only** run does **not** prove the strict merged package percentages; **push and rely on `dotnet-full-regression`** (or run the full solution test + merge flow locally only when you intentionally reproduce CI).",
        "",
        "**Optional local strict reproduction.** To approximate CI before push: Release-build the solution, set **`ARCHLUCID_SQL_TEST`** to a local SQL instance, run **`dotnet test ArchLucid.sln -c Release --settings coverage.runsettings --collect:\"XPlat Code Coverage\"`**, merge Cobertura with ReportGenerator, then run **`assert_merged_line_coverage_min.py`** with the same arguments as the workflow. Expect **long** wall time; this path is for deep debugging, not every edit.",
        "",
        "## Strict profile (product target)",
        "",
        "The long-term merge-blocking target (ratchet goal) is:",
        "",
        "- **Merged line ≥ 95%**",
        "- **Merged branch ≥ 63%**",
        "- **Per-product-package line ≥ 63%** for every gated **`ArchLucid.*`** assembly with coverable lines",
        "",
        "**Compliance status:** **`.github/workflows/ci.yml`** (job **`.NET: full regression (SQL)`**) enforces the **strict profile** below on merged Cobertura. **PRs may fail** until merged line, merged branch, and every gated product **`ArchLucid.*`** package meet the floors (including **`ArchLucid.Jobs.Cli`** — no per-package skip). **Merged line is ratcheted at 95%** (see **`.coverage-floor`** and **`assert_coverage_floor_ratchet.py`**); bring **`coverage-merged-cobertura`** green locally or on CI before relying on merge.",
        "",
        "To verify **strict-profile compliance**, run **`assert_merged_line_coverage_min.py`** on merged **`Cobertura.xml`** with **`95`**, **`--min-branch-pct 63`**, **`--min-package-line-pct 63`** (same as CI; no **`--skip-package-line-gate`**).",
        "",
        "## Current merge-blocking gates",
        "",
        "The **full regression** job in **`.github/workflows/ci.yml`** merges Cobertura output and enforces:",
        "",
        "- **Line coverage ≥ 95%** (merged product assemblies)",
        "- **Branch coverage ≥ 63%**",
        "- **Per-product-package line ≥ 63%** for every gated **`ArchLucid.*`** assembly with coverable lines (see **`scripts/ci/assert_merged_line_coverage_min.py`** invocation in the workflow)",
        "",
        "**Advisory (non-blocking):** packages with line % in **[63%, 70%)** emit **`::warning::`** annotations when **`--warn-below-package-line-pct 70`** is set (see workflow).",
        "",
        "**Fast core + full regression merge:** ReportGenerator **`-reports:`** is built with **`find … -name coverage.cobertura.xml`** (semicolon-separated list). GitHub’s bash often has **`globstar` off**, so a literal **`**/coverage.cobertura.xml`** shell glob can fail to expand; **`find`** avoids silent empty merges.",
        "",
        "**Weakening gates** (lowering percentages or adding **`--skip-package-line-gate`**) requires explicit product / maintainer sign-off and doc updates in this file and **`docs/library/coverage-exclusions.md`**.",
        "",
        "## Local run (merged HTML)",
        "",
        "From repo root (after a **Release** build of tests):",
        "",
        "```bash",
        "dotnet test ArchLucid.sln -c Release --settings coverage.runsettings --collect:\"XPlat Code Coverage\" --results-directory ./coverage-raw",
        "dotnet tool run reportgenerator \"-reports:./coverage-raw/**/coverage.cobertura.xml\" \"-targetdir:./coverage-report\" \"-reporttypes:HtmlSummary\"",
        "```",
        "",
        "Open **`coverage-report/index.html`**.",
        "",
        "## Exclusions",
        "",
        "See **`docs/library/coverage-exclusions.md`** and **`coverage.runsettings`** (generated OpenAPI client, templates, etc.).",
        "",
        "## Hotspots and backlog hooks",
        "",
        "Class-level rankings (uncovered line entries, partial types merged) and **test-backfill notes** are maintained in the tables below. Highest-impact themes aligned with the snapshot:",
        "",
        "1. **`ArchLucid.Persistence`** — lowest line % in that merge (**~40%** for the main **`ArchLucid.Persistence`** package); **`DapperTenantRepository`** and relational read paths dominate uncovered entries.",
        "2. **`ArchLucid.Api`** — **~61%** line; **`AdminDiagnosticsService`**, **`GovernanceController`**, **`EvolutionSimulationService`** drive gaps in the hotspot table.",
        "3. **`ArchLucid.Cli`** — CLI commands and config evaluation remain expensive to cover end-to-end.",
        "4. **`ArchLucid.Host.Core` / `ArchLucid.Host.Composition`** — background processing, DI composition extension methods, and consistency probes carry integration-heavy paths.",
        "",
        "## Security, scalability, reliability, cost",
        "",
        "| Dimension | Tie-in |",
        "|-----------|--------|",
        "| **Security** | Raising coverage on **auth-adjacent**, **tenant isolation**, and **ingest/export** paths reduces regressions in trust boundaries (maps to Persistence + Api + Host layers above). |",
        "| **Scalability** | Coverage does not replace load tests; focus tests on **queue/back-pressure** and **repository batch** branches where complexity sits (**Host.Core**, Persistence reads/writes). |",
        "| **Reliability** | SQL-backed integration tests (**`ARCHLUCID_SQL_TEST`**) materially change Cobertura for Persistence and Api — missing DB ⇒ **under-count** vs CI. |",
        "| **Cost** | Full merges are expensive wall-clock; use **`scripts/ci/test-persistence-local-fast.ps1`** (Windows) / **`.sh`** for tight loops, then **`dotnet-full-regression`** for gate truth. |",
        "",
        "---",
        "",
        "## Snapshot Data",
        "",
        _dataset_note_text(cobertura, repo),
        "",
        "**Measurement:** Production `ArchLucid.*` assemblies only; excludes `*.Tests`, TestSupport, Benchmarks, and "
        "`ArchLucid.Worker` (`Program.cs` omitted per **`coverage.runsettings`** **`ExcludeByFile`**).",
        "",
        "## All assemblies by line coverage (lowest first)",
        "",
        "| Assembly | Line coverage % | Coverable lines (approx.) |",
        "|----------|-----------------|---------------------------|",
    ]

    for name, lr, total_lines, _class_rows in packages:
        out_lines.append(f"| {name} | {lr * 100.0:.2f} | {total_lines} |")

    out_lines.extend(
        [
            "",
            "## Per-assembly class gaps (by line coverage %)",
            "",
            "Per Cobertura **class** aggregate `<lines>` rows. **Line coverage %** is **(coverable − uncovered) / coverable** for that class. "
            "**Partial types** merged by **class name + file**. Sort order: **lowest assembly line % first**, **except** "
            f"**`{_DECISIONING_PACKAGE}`** — that assembly is placed **near the bottom** (after **`ArchLucid.AgentSimulator`**, "
            "before **`100.00%`** assemblies) because its class list is large.",
            "",
            "**Prior attempt?** — **Yes** if the fully-qualified type name (or its short name, length ≥ **8**) appears as a substring in "
            "`docs/COVERAGE_GAP_ANALYSIS.md` (heuristic; very short names are not matched on their own).",
            "",
        ]
    )

    for name, lr, total_lines, class_rows in _per_assembly_emit_order(packages):
        out_lines.append(f"### {name} ({lr * 100.0:.2f}% line coverage)")
        out_lines.append("")

        if not class_rows:
            out_lines.append("_No Cobertura class rows with coverable lines for this package._")
            out_lines.append("")
            continue

        sorted_by_rate = sorted(class_rows, key=lambda t: t[2])
        top3 = sorted_by_rate[:3]
        out_lines.append("#### Top 3 classes by lowest line coverage %")
        out_lines.append("")
        _emit_class_gap_markdown_rows(out_lines, top3, repo, recent_notes_lower)
        out_lines.append("")

        below_threshold = [row for row in sorted_by_rate if row[2] < _GAP_CLASS_LINE_RATE_THRESHOLD]
        out_lines.append(
            f"#### All classes below {_GAP_CLASS_LINE_RATE_THRESHOLD * 100.0:.0f}% line coverage"
        )
        out_lines.append("")

        if not below_threshold:
            out_lines.append(
                f"_No classes below {_GAP_CLASS_LINE_RATE_THRESHOLD * 100.0:.0f}% line coverage in Cobertura for this assembly._"
            )
        else:
            _emit_class_gap_markdown_rows(
                out_lines, below_threshold, repo, recent_notes_lower
            )

        out_lines.append("")

    out_lines.extend(
        [
            "## Merged totals (reference)",
            "",
        ]
    )
    line_raw = root.get("line-rate")
    branch_raw = root.get("branch-rate")
    if line_raw:
        out_lines.append(f"- **Merged line coverage:** {float(line_raw) * 100.0:.2f}%")
    if branch_raw:
        out_lines.append(f"- **Merged branch coverage:** {float(branch_raw) * 100.0:.2f}%")
    out_lines.append("")
    out_lines.append("## How to refresh")
    out_lines.append("")
    out_lines.append("```powershell")
    out_lines.append("# Remove old shards so ReportGenerator does not merge stale + new Cobertura files.")
    out_lines.append("Remove-Item -Recurse -Force .\\coverage-gap-1a -ErrorAction SilentlyContinue")
    out_lines.append("dotnet test ArchLucid.sln -c Release --settings coverage.runsettings `")
    out_lines.append("  --collect:\"XPlat Code Coverage\" --results-directory .\\coverage-gap-1a")
    out_lines.append("dotnet tool restore")
    out_lines.append(
        "dotnet reportgenerator \"-reports:coverage-gap-1a/**/coverage.cobertura.xml\" "
        "\"-targetdir:coverage-gap-1a/merged\" \"-reporttypes:Cobertura\""
    )
    out_lines.append("python scripts/ci/coverage_gap_analysis.py")
    out_lines.append("# Or: gh run download <run-id> -n coverage-merged-cobertura -D .\\ci-cov")
    out_lines.append("#     python scripts/ci/coverage_gap_analysis.py --cobertura .\\ci-cov\\Cobertura.xml")
    out_lines.append("```")
    out_lines.append("")

    dest = repo / "docs" / "COVERAGE_GAP_ANALYSIS.md"
    dest.write_text("\n".join(out_lines), encoding="utf-8")
    print(f"Wrote {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
