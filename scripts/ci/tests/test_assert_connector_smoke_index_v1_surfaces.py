from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


def _load_guard():
    root = Path(__file__).resolve().parents[3]
    path = root / "scripts" / "ci" / "assert_connector_smoke_index_v1_surfaces.py"
    spec = importlib.util.spec_from_file_location("connector_smoke_index_v1_guard", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    spec.loader.exec_module(module)
    return module


class TestAssertConnectorSmokeIndexV1Surfaces(unittest.TestCase):
    def test_live_docs_pass_guard(self) -> None:
        guard = _load_guard()
        self.assertEqual(guard.main([]), 0)
