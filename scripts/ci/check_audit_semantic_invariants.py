#!/usr/bin/env python3
"""Fail when high-value audit flows lack matrix documentation (improvement #25)."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REPORT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_audit_path_semantics.py"


def _load_report_module():
    spec = importlib.util.spec_from_file_location("report_audit_path_semantics", REPORT_SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load report_audit_path_semantics.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def audit_semantic_invariant_violations(root: Path) -> list[str]:
    module = _load_report_module()
    summary = module.build_summary(root)
    disposition = str(summary.get("disposition", ""))
    undocumented = int(summary.get("undocumentedFlowCount", 0))

    if disposition != "PASS" or undocumented > 0:
        return [
            f"audit path semantics disposition={disposition!r} undocumentedFlowCount={undocumented}"
        ]

    return []


def main() -> int:
    violations = audit_semantic_invariant_violations(REPO_ROOT)

    if violations:
        print("Audit semantic invariants FAILED:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Audit semantic invariants: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
