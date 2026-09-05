"""TB-251 retrieval indexing outbox drift guards (Batch 5BX)."""

from __future__ import annotations

import unittest
from pathlib import Path

from ci_test_helpers import REPO_ROOT


class TestTraceabilityBatch5BX(unittest.TestCase):
    def test_tb_251_outbox_repository(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Persistence"
            / "Coordination"
            / "Retrieval"
            / "DapperRetrievalIndexingOutboxRepository.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("RetrievalIndexingOutbox", text)
        self.assertIn("DequeuePendingAsync", text)

    def test_tb_251_processor_hosted(self) -> None:
        registrar_dir = (
            REPO_ROOT
            / "ArchLucid.Host.Composition"
            / "Startup"
            / "Modules"
        )
        text = "".join(
            path.read_text(encoding="utf-8")
            for path in sorted(registrar_dir.glob("OutboxProcessorsCompositionRegistrar*.cs"))
        )
        self.assertIn("IRetrievalIndexingOutboxProcessor", text)


if __name__ == "__main__":
    unittest.main()
