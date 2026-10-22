from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


def _load_guard():
    root = Path(__file__).resolve().parents[3]
    path = root / "scripts" / "ci" / "check_quote_to_proof_packet.py"
    spec = importlib.util.spec_from_file_location("quote_to_proof_packet_guard", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    spec.loader.exec_module(module)
    return module


class TestCheckQuoteToProofPacket(unittest.TestCase):
    def test_live_index_passes_guard(self) -> None:
        guard = _load_guard()
        self.assertEqual(guard.main(), 0)
