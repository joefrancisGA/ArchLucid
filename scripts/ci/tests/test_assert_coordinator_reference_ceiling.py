"""Unit tests for coordinator reference ceiling helper logic."""

from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path


def _load_module():
    path = Path(__file__).resolve().parents[1] / "assert_coordinator_reference_ceiling.py"
    spec = importlib.util.spec_from_file_location("assert_coordinator_reference_ceiling", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load assert_coordinator_reference_ceiling.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class TestCoordinatorReferenceCeiling(unittest.TestCase):
    def test_baseline_json_has_tokens(self) -> None:
        mod = _load_module()
        data = json.loads(mod.BASELINE_PATH.read_text(encoding="utf-8"))
        self.assertIn("tokens", data)
        self.assertIsInstance(data["tokens"], dict)
        self.assertGreater(len(data["tokens"]), 0)

    def test_count_tokens_returns_dict(self) -> None:
        mod = _load_module()
        data = json.loads(mod.BASELINE_PATH.read_text(encoding="utf-8"))
        tokens = list(data["tokens"].keys())
        counts = mod.count_tokens(tokens)
        for t in tokens:
            self.assertIn(t, counts)
            self.assertGreaterEqual(counts[t], 0)


if __name__ == "__main__":
    unittest.main()
