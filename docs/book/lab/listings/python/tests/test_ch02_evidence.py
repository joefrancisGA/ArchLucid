"""Chapter 2: a path is only as machine-grounded as its weakest hop."""

from __future__ import annotations

import unittest

import support  # noqa: F401
from ch02_evidence import MachineEvidence, path_machine_grounding


class MachineGrounding(unittest.TestCase):
    def test_weakest_hop_wins(self) -> None:
        hops = [MachineEvidence.OBSERVED_FACT, MachineEvidence.AI_INFERENCE, MachineEvidence.DERIVED_FACT]

        self.assertIs(path_machine_grounding(hops), MachineEvidence.AI_INFERENCE)

    def test_all_observed(self) -> None:
        hops = [MachineEvidence.OBSERVED_FACT] * 3

        self.assertIs(path_machine_grounding(hops), MachineEvidence.OBSERVED_FACT)

    def test_ordering(self) -> None:
        self.assertLess(MachineEvidence.DETERMINISTIC_INFERENCE, MachineEvidence.DERIVED_FACT)

    def test_empty_path_raises(self) -> None:
        with self.assertRaises(ValueError):
            path_machine_grounding([])


if __name__ == "__main__":
    unittest.main()
