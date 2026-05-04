#!/usr/bin/env python3
"""CI guard: keep Terraform multi-root ordering sources aligned.

Fails when `infra/terraform-pilot/main.tf` path order diverges from
`infra/apply-saas.ps1` `$multiRootSequence`.

Also asserts `provision-landing-zone.ps1` and `.sh` list the same roots (set equality),
each path exists under the repo, and stderr-warns when provision lists differ from the
pilot canonical set (e.g. optional roots omitted for validate-only sweeps).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _paths_from_pilot_main_tf(content: str) -> list[str]:
    """Ordered `path = \"infra/...\"` values in terraform-pilot main.tf."""
    return re.findall(r'^\s+path\s*=\s*"(infra/terraform[^"]*)"\s*$', content, flags=re.MULTILINE)


def _paths_from_ps1_array(content: str, marker: str) -> list[str]:
    """
    Parse PowerShell string array after e.g. `$orderedRoots = @(` until closing `)`.
    marker: line containing `= @(` e.g. `$orderedRoots = @(`.
    """
    lines = content.splitlines()
    start = -1
    for i, line in enumerate(lines):
        if marker in line and "@(" in line:
            start = i + 1
            break
    if start < 0:
        raise ValueError(f"Could not find array start for marker {marker!r}")

    out: list[str] = []
    for j in range(start, len(lines)):
        line = lines[j].strip()
        if line.startswith(")"):
            break
        m = re.match(r'^"([^"]+)"\s*,?\s*$', line)
        if m:
            out.append(m.group(1))
    return out


def _paths_from_bash_array(content: str) -> list[str]:
    """Parse ORDERED_ROOTS=( ... ) in provision-landing-zone.sh."""
    m = re.search(
        r"ORDERED_ROOTS=\(\s*((?:\s*\"[^\"]+\"\s*)+)\s*\)",
        content,
        flags=re.DOTALL,
    )
    if not m:
        raise ValueError("Could not find ORDERED_ROOTS=( ...) in shell script")
    return re.findall(r'"([^"]+)"', m.group(1))


def _apply_saas_multi_root_sequence(content: str) -> list[str]:
    return _paths_from_ps1_array(content, "$multiRootSequence")


def _provision_ps1_ordered_roots(content: str) -> list[str]:
    return _paths_from_ps1_array(content, "$orderedRoots")


def main() -> int:
    root = _repo_root()
    pilot_tf = root / "infra" / "terraform-pilot" / "main.tf"
    apply_ps1 = root / "infra" / "apply-saas.ps1"
    prov_ps1 = root / "scripts" / "provision-landing-zone.ps1"
    prov_sh = root / "scripts" / "provision-landing-zone.sh"

    for p in (pilot_tf, apply_ps1, prov_ps1, prov_sh):
        if not p.is_file():
            print(f"Missing file: {p}", file=sys.stderr)
            return 2

    pilot_paths = _paths_from_pilot_main_tf(_read_text(pilot_tf))
    apply_paths = _apply_saas_multi_root_sequence(_read_text(apply_ps1))
    prov_paths_ps = _provision_ps1_ordered_roots(_read_text(prov_ps1))
    prov_paths_sh = _paths_from_bash_array(_read_text(prov_sh))

    errors: list[str] = []

    if pilot_paths != apply_paths:
        errors.append(
            "infra/apply-saas.ps1 ($multiRootSequence) must exactly match infra/terraform-pilot "
            f"nested_infrastructure_roots path order.\n  pilot ({len(pilot_paths)}): {pilot_paths}\n  "
            f"apply ({len(apply_paths)}): {apply_paths}",
        )

    set_ps = frozenset(prov_paths_ps)
    set_sh = frozenset(prov_paths_sh)
    if set_ps != set_sh:
        only_ps = sorted(set_ps - set_sh)
        only_sh = sorted(set_sh - set_ps)
        errors.append(
            "scripts/provision-landing-zone.ps1 and scripts/provision-landing-zone.sh must list "
            f"the same Terraform roots.\n  only in ps1: {only_ps}\n  only in sh: {only_sh}",
        )

    referenced = sorted(frozenset(pilot_paths) | set_ps | set_sh)

    missing_dirs: list[str] = []
    for rel in referenced:
        p = root / rel
        if not p.is_dir():
            missing_dirs.append(rel)

    if missing_dirs:
        errors.append(
            "Each referenced root directory must exist under the repo:\n  missing: "
            + ", ".join(missing_dirs),
        )

    pilot_set = frozenset(pilot_paths)
    if set_ps != pilot_set:
        only_pilot = sorted(pilot_set - set_ps)
        only_prov = sorted(set_ps - pilot_set)
        print(
            "WARN: provision-landing-zone.ps1 root set differs from terraform-pilot sequence "
            f"(often intentional for validate-only sweeps).\n"
            f"  in pilot only: {only_pilot}\n  in provision script only: {only_prov}\n",
            file=sys.stderr,
        )

    if prov_paths_ps != prov_paths_sh and set_ps == set_sh:
        print(
            "WARN: provision-landing-zone.ps1 and .sh list the same roots but order differs.",
            file=sys.stderr,
        )

    if errors:
        for msg in errors:
            print(msg, file=sys.stderr)
        return 1

    print(
        "OK: Terraform root ordering sync - pilot/apply sequences match "
        f"({len(pilot_paths)} roots); provision ps1/sh sets match ({len(set_ps)} roots)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
