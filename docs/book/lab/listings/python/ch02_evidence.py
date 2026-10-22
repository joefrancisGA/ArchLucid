"""Chapter 2 listings: machine grounding of a path.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch02_evidence.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations


# region machine_grounding
from enum import IntEnum


class MachineEvidence(IntEnum):
    # Higher value means more directly grounded in the environment.
    AI_INFERENCE = 1
    DETERMINISTIC_INFERENCE = 2
    DERIVED_FACT = 3
    OBSERVED_FACT = 4


def path_machine_grounding(hops: list[MachineEvidence]) -> MachineEvidence:
    """A path is only as machine-grounded as its least-grounded required hop."""
    if not hops:
        raise ValueError("A path must have at least one hop.")

    return min(hops)
# endregion machine_grounding
