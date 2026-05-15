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


def is_target_product_package(name: str) -> bool:
    if not is_product_archlucid_package(name):
        return False
    if "Benchmark" in name:
        return False
    if name in _GAP_ANALYSIS_OMIT_PACKAGES:
        return False
    return True


def _recent_md_without_library_header(raw: str) -> str:
    """
    Strip docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md front-matter blockquotes so the main
    doc keeps a single top-level Scope/Spine header (merge-blocking doc-scope CI).
    """
    lines = raw.replace("\r\n", "\n").split("\n")
    for i, line in enumerate(lines):
        if line.strip().startswith("## Recent targeted tests"):
            return "\n".join(lines[i:]).strip()

    out: list[str] = []
    skip_block = True
    for line in lines:
        stripped = line.strip()
        if skip_block:
            if not stripped:
                continue
            if stripped.startswith("> "):
                continue
            skip_block = False

        out.append(line)

    return "\n".join(out).strip()


def _uncovered_entries_in_aggregate_lines(lines_parent: ET.Element) -> int:
    """Count <line hits=\"0\"/> under Cobertura's class-level aggregate <lines> block."""
    n = 0
    for child in lines_parent:
        if local_name(child.tag) != "line":
            continue
        hits = child.get("hits")
        if hits is None:
            continue
        try:
            if int(hits) == 0:
                n += 1
        except ValueError:
            pass
    return n


def uncovered_by_class_rows(package_el: ET.Element) -> list[tuple[str, str, int]]:
    """Cobertura <class>: type name, filename, uncovered line entries (class aggregate lines only).

    Multiple <class> nodes for the same (name, file) (e.g. partial types) have counts summed.
    """
    acc: dict[tuple[str, str], int] = defaultdict(int)
    for element in package_el.iter():
        if local_name(element.tag) != "class":
            continue
        type_name = (element.get("name") or "").strip() or "(unnamed type)"
        fn = (element.get("filename") or "").strip()
        uncovered = 0
        for child in element:
            if local_name(child.tag) != "lines":
                continue
            uncovered += _uncovered_entries_in_aggregate_lines(child)
        key = (type_name, fn)
        acc[key] += uncovered
    return [(name, fn, cnt) for (name, fn), cnt in acc.items()]


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
        "See **`docs/library/CODE_COVERAGE.md`** — local merges without **`ARCHLUCID_SQL_TEST`** under-count SQL-only paths."
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

    packages: list[tuple[str, float, int, list[tuple[str, str, int]]]] = []
    for pkg in root.iter():
        if local_name(pkg.tag) != "package":
            continue
        name = (pkg.get("name") or "").strip()
        if not name or not is_target_product_package(name):
            continue
        lr = pkg.get("line-rate")
        if lr is None:
            continue
        line_rate = float(lr)
        class_rows = uncovered_by_class_rows(pkg)
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
            "## Up to three classes per assembly with the most uncovered line entries",
            "",
            "Per Cobertura **class** aggregate line blocks (`<class>/<lines>/<line hits=\"…\"/>`). ",
            "**Partial types** merged by **class name + file**.",
            "",
        ]
    )

    for name, lr, total_lines, class_rows in packages:
        out_lines.append(f"### {name} ({lr * 100.0:.2f}% line coverage)")
        out_lines.append("")
        nonzero = [(cn, fp, cnt) for cn, fp, cnt in class_rows if cnt > 0]
        if not nonzero:
            out_lines.append("_No uncovered line rows in Cobertura for this package (or only branches uncovered)._")
            out_lines.append("")
            continue
        ranked = sorted(nonzero, key=lambda t: t[2], reverse=True)[:3]
        out_lines.append("| Rank | Class | File | Uncovered line entries |")
        out_lines.append("|------|-------|------|------------------------|")
        for i, (cls, path, n) in enumerate(ranked, start=1):
            rel = _rel_path_for_doc(repo, path)
            out_lines.append(f"| {i} | `{cls}` | `{rel}` | {n} |")
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
    recent_path = repo / "docs" / "library" / "COVERAGE_GAP_ANALYSIS_RECENT.md"
    if recent_path.is_file():
        out_lines.append(_recent_md_without_library_header(recent_path.read_text(encoding="utf-8")))
        out_lines.append("")
    out_lines.append("## How to refresh")
    out_lines.append("")
    out_lines.append(
        "Narrative bullets under **Recent targeted tests** live in "
        "`docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md` and are merged by this script when that file exists."
    )
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
