#!/usr/bin/env python3
"""CI guard: keep Terraform multi-root ordering sources aligned.

Fails when `infra/terraform-pilot/main.tf` leaf `path =` order diverges from
`infra/apply-saas.ps1` `$multiRootSequence`.

Landing-zone scripts must wrap apply-saas.ps1 (no competing root arrays).
Hosted wave leaf arrays must flatten to `$multiRootSequence` minus orchestrator.
Composition roots must exist as directories with `.tf` files.
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
    """Ordered leaf `path = \"infra/...\"` values in terraform-pilot main.tf."""
    return re.findall(r'^\s+path\s*=\s*"(infra/terraform[^"]*)"\s*$', content, flags=re.MULTILINE)


def _root_paths_from_pilot(content: str) -> list[str]:
    """Ordered composition-root `root_path =` values (must not use `path =`)."""
    return re.findall(
        r'^\s+root_path\s*=\s*"(infra/terraform[^"]*)"\s*$',
        content,
        flags=re.MULTILINE,
    )


def _paths_from_ps1_array(content: str, marker: str) -> list[str]:
    """
    Parse PowerShell string array after e.g. `$multiRootSequence = @(` until closing `)`.
    marker: substring that appears on the `= @(` line.
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


def _apply_saas_multi_root_sequence(content: str) -> list[str]:
    return _paths_from_ps1_array(content, "$multiRootSequence")


def _assert_provision_delegates(ps1: str, sh: str) -> list[str]:
    errors: list[str] = []
    if "$orderedRoots" in ps1:
        errors.append(
            "scripts/provision-landing-zone.ps1 must not keep $orderedRoots; wrap apply-saas.ps1",
        )
    if "ORDERED_ROOTS" in sh:
        errors.append(
            "scripts/provision-landing-zone.sh must not keep ORDERED_ROOTS; wrap apply-saas.ps1",
        )
    if "apply-saas.ps1" not in ps1:
        errors.append("scripts/provision-landing-zone.ps1 must call apply-saas.ps1")
    if "apply-saas.ps1" not in sh:
        errors.append("scripts/provision-landing-zone.sh must call apply-saas.ps1")
    return errors


def _assert_wave_flatten(apply_ps1: str, multi_root: list[str]) -> list[str]:
    errors: list[str] = []
    foundation = _paths_from_ps1_array(apply_ps1, "$foundationWaveLeaves")
    platform = _paths_from_ps1_array(apply_ps1, "$platformWaveLeaves")
    app = _paths_from_ps1_array(apply_ps1, "$appWaveLeaves")
    hosted = foundation + platform + app
    expected = [p for p in multi_root if p != "infra/terraform-orchestrator"]
    if hosted != expected:
        errors.append(
            "foundation + platform + app wave leaves must equal $multiRootSequence minus "
            f"terraform-orchestrator.\n  waves ({len(hosted)}): {hosted}\n  "
            f"expected ({len(expected)}): {expected}",
        )
    return errors


def _assert_composition_roots(
    root: Path,
    apply_ps1: str,
    pilot_root_paths: list[str],
) -> list[str]:
    errors: list[str] = []
    quoted = _paths_from_ps1_array(apply_ps1, "$hostedCompositionRoots")
    if quoted != [
        "infra/terraform-foundation",
        "infra/terraform-platform",
        "infra/terraform-app",
    ]:
        errors.append(
            "$hostedCompositionRoots must be foundation, platform, app in that order. "
            f"Got: {quoted}",
        )
    if pilot_root_paths != quoted:
        errors.append(
            "terraform-pilot composition root_path order must match $hostedCompositionRoots.\n"
            f"  pilot: {pilot_root_paths}\n  apply: {quoted}",
        )
    missing: list[str] = []
    for rel in quoted:
        directory = root / rel
        if not directory.is_dir():
            missing.append(rel)
            continue
        if not any(directory.glob("*.tf")):
            missing.append(f"{rel} (no .tf files)")
    if missing:
        errors.append(
            "Each composition root must exist with .tf files: " + ", ".join(missing),
        )
    return errors


def main() -> int:
    root = _repo_root()
    pilot_tf = root / "infra" / "terraform-pilot" / "main.tf"
    apply_ps1_path = root / "infra" / "apply-saas.ps1"
    prov_ps1 = root / "scripts" / "provision-landing-zone.ps1"
    prov_sh = root / "scripts" / "provision-landing-zone.sh"

    for p in (pilot_tf, apply_ps1_path, prov_ps1, prov_sh):
        if not p.is_file():
            print(f"Missing file: {p}", file=sys.stderr)
            return 2

    pilot_text = _read_text(pilot_tf)
    apply_text = _read_text(apply_ps1_path)
    pilot_paths = _paths_from_pilot_main_tf(pilot_text)
    apply_paths = _apply_saas_multi_root_sequence(apply_text)
    pilot_root_paths = _root_paths_from_pilot(pilot_text)

    errors: list[str] = []

    if pilot_paths != apply_paths:
        errors.append(
            "infra/apply-saas.ps1 ($multiRootSequence) must exactly match infra/terraform-pilot "
            f"nested_infrastructure_roots path order.\n  pilot ({len(pilot_paths)}): {pilot_paths}\n  "
            f"apply ({len(apply_paths)}): {apply_paths}",
        )

    errors.extend(_assert_provision_delegates(_read_text(prov_ps1), _read_text(prov_sh)))
    errors.extend(_assert_wave_flatten(apply_text, apply_paths))
    errors.extend(_assert_composition_roots(root, apply_text, pilot_root_paths))

    referenced = sorted(frozenset(pilot_paths) | frozenset(apply_paths) | frozenset(pilot_root_paths))
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

    if errors:
        for msg in errors:
            print(msg, file=sys.stderr)
        return 1

    print(
        "OK: Terraform root ordering sync - pilot/apply leaf sequences match "
        f"({len(pilot_paths)} roots); landing-zone scripts wrap apply-saas.ps1; "
        f"hosted waves flatten to {len(pilot_paths) - 1} leaves.",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
