#!/usr/bin/env python3
"""Shared Cobertura parsing for CI coverage gates and PR comment builder."""

from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path


def local_name(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def is_product_archlucid_package(name: str) -> bool:
    """True for ArchLucid.* production assemblies; excludes tests and TestSupport."""
    if not name.startswith("ArchLucid."):
        return False
    lower = name.lower()
    if ".tests" in lower or name.endswith("Tests"):
        return False
    if "tests." in lower or ".testsupport" in lower or "TestSupport" in name:
        return False
    return True


@dataclass(frozen=True)
class CoberturaPackageMetrics:
    name: str
    line_rate: float | None
    branch_rate: float | None
    coverable_lines: int


@dataclass(frozen=True)
class CoberturaSummary:
    """Merged Cobertura root + per-package metrics."""

    root_line_pct: float | None
    root_branch_pct: float | None
    packages: list[CoberturaPackageMetrics]


def _count_coverable_lines(package_element: ET.Element) -> int:
    """Count <line number=\"…\"/> descendants under a <package> (executable lines)."""
    n = 0
    for element in package_element.iter():
        if local_name(element.tag) != "line":
            continue
        if element.get("number") is not None:
            n += 1
    return n


def parse_cobertura(path: Path) -> CoberturaSummary | None:
    """Parse merged Cobertura.xml; return None if missing or malformed."""
    if not path.is_file():
        return None

    try:
        tree = ET.parse(path)
    except ET.ParseError:
        return None

    root = tree.getroot()
    if root is None:
        return None

    line_raw = root.get("line-rate")
    branch_raw = root.get("branch-rate")
    root_line_pct = float(line_raw) * 100.0 if line_raw is not None else None
    root_branch_pct = float(branch_raw) * 100.0 if branch_raw is not None else None

    packages: list[CoberturaPackageMetrics] = []
    for element in root.iter():
        if local_name(element.tag) != "package":
            continue
        name = (element.get("name") or "").strip()
        if not name:
            continue
        lr = element.get("line-rate")
        br = element.get("branch-rate")
        line_rate = float(lr) if lr is not None else None
        branch_rate = float(br) if br is not None else None
        coverable = _count_coverable_lines(element)
        packages.append(
            CoberturaPackageMetrics(
                name=name,
                line_rate=line_rate,
                branch_rate=branch_rate,
                coverable_lines=coverable,
            ),
        )

    packages.sort(key=lambda p: p.name)
    return CoberturaSummary(
        root_line_pct=root_line_pct,
        root_branch_pct=root_branch_pct,
        packages=packages,
    )


def parse_cobertura_packages_simple(path: Path) -> tuple[float | None, list[tuple[str, float]]]:
    """Backward-compatible shape for PR comment: (overall_line_pct, [(name, line_pct), …])."""
    summary = parse_cobertura(path)
    if summary is None:
        return None, []
    rows: list[tuple[str, float]] = []
    for p in summary.packages:
        if p.line_rate is None:
            continue
        rows.append((p.name, p.line_rate * 100.0))
    return summary.root_line_pct, rows


def product_packages_for_gate(summary: CoberturaSummary) -> list[CoberturaPackageMetrics]:
    """Product ArchLucid.* packages with at least one coverable line (per-package gate applies)."""
    return [p for p in summary.packages if is_product_archlucid_package(p.name) and p.coverable_lines > 0]
