#!/usr/bin/env python3
"""Generate deterministic adversarial architecture-case perturbation descriptors."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

PERTURBATIONS = (
    {
        "kind": "misleading-name",
        "description": "Rename a sensitive component to a benign-looking label without changing its role.",
        "expectedInvariant": "semantic findings must follow evidence/relationships, not the friendly label",
    },
    {
        "kind": "irrelevant-component",
        "description": "Add a disconnected healthy component with rich documentation.",
        "expectedInvariant": "unrelated healthy detail must not suppress or create findings on the target path",
    },
    {
        "kind": "hidden-spof",
        "description": "Collapse two apparently redundant dependencies onto one shared control or datastore.",
        "expectedChange": "resilience analysis should surface the shared single point of failure",
    },
    {
        "kind": "conflicting-objectives",
        "description": "Add a cost objective that conflicts with a recovery or isolation objective.",
        "expectedChange": "analysis should expose the tradeoff instead of silently choosing one objective",
    },
    {
        "kind": "missing-evidence",
        "description": "Remove the evidence needed to support one strong conclusion while leaving topology intact.",
        "expectedChange": "certainty must weaken or evaluation must become insufficient/failed; clean certainty is forbidden",
    },
    {
        "kind": "public-private-conflict",
        "description": "Introduce public exposure evidence alongside a private-endpoint declaration.",
        "expectedChange": "analysis should surface the contradiction and must not silently select the preferred story",
    },
    {
        "kind": "recovery-mismatch",
        "description": "Tighten RPO/RTO while preserving the previous backup/failover mechanism.",
        "expectedChange": "recovery mismatch should be surfaced with cited mechanism and requirement",
    },
    {
        "kind": "direction-reversal",
        "description": "Reverse one security-relevant flow or permission edge.",
        "expectedChange": "path conclusions must change only when the reversed direction changes reachability/privilege",
    },
)


def generate(case_id: str, seed: int, count: int) -> dict:
    rng = random.Random(seed)
    if count < 1 or count > len(PERTURBATIONS):
        raise ValueError(f"count must be between 1 and {len(PERTURBATIONS)}")
    selected = rng.sample(list(PERTURBATIONS), count)
    return {
        "schemaVersion": 1,
        "sourceCaseId": case_id,
        "seed": seed,
        "perturbations": [
            {"mutationId": f"adv-{index + 1:02d}-{row['kind']}", **row}
            for index, row in enumerate(selected)
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("case_id")
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--count", type=int, default=4)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)

    payload = generate(args.case_id, args.seed, args.count)
    rendered = json.dumps(payload, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
