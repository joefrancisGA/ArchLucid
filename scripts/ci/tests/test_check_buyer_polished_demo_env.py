#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


_CI = Path(__file__).resolve().parents[1]
_REPO = _CI.parents[1]


def _load_module():
    script = _CI / "check_buyer_polished_demo_env.py"
    spec = importlib.util.spec_from_file_location("_check_buyer_polished_demo_env", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load buyer polished demo env guard.")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module


class TestCheckBuyerPolishedDemoEnv(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mod = _load_module()

    def test_flags_operator_without_demo_in_example_env(self) -> None:
        text = "NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator\nNEXT_PUBLIC_API_BASE_URL=http://localhost:5000\n"
        violations = self.mod._scan_text(Path("archlucid-ui/.env.example"), text)

        self.assertEqual(len(violations), 1)

    def test_allows_operator_with_static_demo(self) -> None:
        text = (
            "NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator\n"
            "NEXT_PUBLIC_DEMO_STATIC_OPERATOR=true\n"
        )
        violations = self.mod._scan_text(Path("archlucid-ui/.env.example"), text)

        self.assertEqual(violations, [])


if __name__ == "__main__":
    raise SystemExit(unittest.main())
