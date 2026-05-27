#!/usr/bin/env python3
"""Offline retrieval IR scoring for golden fixtures (TB-049 / RAG-V1-011).

Mirrors ``InMemoryVectorIndex`` cosine search with tenant scope filters. Reads
``tests/eval-datasets/retrieval-golden/cases.json`` and writes
``docs/quality/retrieval-ir-report.md``. Exit 0 by default; use ``--enforce`` to fail
when mean recall@5 or MRR drops below configured floors.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0

    dot = 0.0
    mag_a = 0.0
    mag_b = 0.0

    for i in range(len(a)):
        dot += a[i] * b[i]
        mag_a += a[i] * a[i]
        mag_b += b[i] * b[i]

    if mag_a == 0.0 or mag_b == 0.0:
        return 0.0

    return dot / (math.sqrt(mag_a) * math.sqrt(mag_b))


def _matches_scope(chunk: dict[str, object], case: dict[str, object]) -> bool:
    tenant_match = (
        str(chunk.get("tenantId") or "") == str(case.get("tenantId") or "")
        and str(chunk.get("workspaceId") or "") == str(case.get("workspaceId") or "")
        and str(chunk.get("projectId") or "") == str(case.get("projectId") or "")
    )

    include_platform = bool(case.get("includePlatformCorpora"))

    if tenant_match:
        return True

    if not include_platform:
        return False

    platform_tenant = "00000000-0000-0000-0000-000000000000"

    return str(chunk.get("tenantId") or "") == platform_tenant


def _search(
    corpus: list[dict[str, object]],
    case: dict[str, object],
    query_embedding: list[float],
    top_k: int,
) -> list[str]:
    scored: list[tuple[float, str]] = []

    for chunk in corpus:
        if not _matches_scope(chunk, case):
            continue

        embedding = chunk.get("embedding")
        if not isinstance(embedding, list):
            continue

        score = _cosine(query_embedding, [float(x) for x in embedding])
        scored.append((score, str(chunk.get("chunkId") or "")))

    scored.sort(key=lambda row: row[0], reverse=True)

    return [chunk_id for _, chunk_id in scored[:top_k] if chunk_id]


def _recall_at_k(retrieved: list[str], expected: list[str], k: int) -> float:
    if not expected:
        return 1.0

    top = retrieved[:k]
    hits = sum(1 for chunk_id in expected if chunk_id in top)

    return hits / float(len(expected))


def _mrr(retrieved: list[str], expected: list[str]) -> float:
    if not expected:
        return 1.0

    expected_set = set(expected)

    for rank, chunk_id in enumerate(retrieved, start=1):
        if chunk_id in expected_set:
            return 1.0 / float(rank)

    return 0.0


def _write_report(
    path: Path,
    *,
    rows: list[dict[str, object]],
    mean_recall: float,
    mean_mrr: float,
    min_recall: float,
    min_mrr: float,
) -> None:
    lines = [
        "# Retrieval IR report",
        "",
        f"- **Cases evaluated:** {len(rows)}",
        f"- **Mean recall@5:** {mean_recall:.4f}",
        f"- **Mean MRR:** {mean_mrr:.4f}",
        f"- **Floor recall@5:** {min_recall:.4f}",
        f"- **Floor MRR:** {min_mrr:.4f}",
        "",
        "## Per-case results",
        "",
        "| Case | Corpus | recall@5 | MRR |",
        "|------|--------|----------|-----|",
    ]

    for row in rows:
        lines.append(
            f"| {row['id']} | {row.get('corpusKind', '')} | {float(row['recallAt5']):.4f} | {float(row['mrr']):.4f} |"
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--enforce", action="store_true", help="Exit 1 when IR floors are not met.")
    parser.add_argument(
        "--cases",
        type=Path,
        default=None,
        help="Override path to cases.json (default: tests/eval-datasets/retrieval-golden/cases.json).",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=None,
        help="Override report output path (default: docs/quality/retrieval-ir-report.md).",
    )
    args = parser.parse_args(argv)

    root = _repo_root()
    cases_path = args.cases or (root / "tests" / "eval-datasets" / "retrieval-golden" / "cases.json")
    report_path = args.report or (root / "docs" / "quality" / "retrieval-ir-report.md")

    if not cases_path.is_file():
        print(f"::error::Missing {cases_path}")
        return 1

    payload = _load_json(cases_path)
    if not isinstance(payload, dict):
        print("::error::cases.json must be an object")
        return 1

    min_recall = float(payload.get("minRecallAt5", 0.8))
    min_mrr = float(payload.get("minMrr", 0.7))
    raw_corpus = payload.get("corpus")
    raw_cases = payload.get("cases")

    if not isinstance(raw_corpus, list) or not raw_corpus:
        print("::error::corpus must be a non-empty array")
        return 1

    if not isinstance(raw_cases, list) or not raw_cases:
        print("::error::cases must be a non-empty array")
        return 1

    corpus: list[dict[str, object]] = [c for c in raw_corpus if isinstance(c, dict)]
    evaluated: list[dict[str, object]] = []
    recalls: list[float] = []
    mrrs: list[float] = []

    for entry in raw_cases:
        if not isinstance(entry, dict):
            print("::error::each case must be an object")
            return 1

        case_id = str(entry.get("id") or "unknown")
        query_embedding = entry.get("queryEmbedding")
        expected = entry.get("expectedChunkIds")
        top_k = int(entry.get("topK") or 5)

        if not isinstance(query_embedding, list) or not query_embedding:
            print(f"::error::case {case_id}: queryEmbedding must be a non-empty array")
            return 1

        if not isinstance(expected, list):
            print(f"::error::case {case_id}: expectedChunkIds must be an array")
            return 1

        expected_ids = [str(x) for x in expected if str(x).strip()]
        retrieved = _search(corpus, entry, [float(x) for x in query_embedding], top_k)
        recall = _recall_at_k(retrieved, expected_ids, 5)
        mrr = _mrr(retrieved, expected_ids)

        recalls.append(recall)
        mrrs.append(mrr)
        evaluated.append(
            {
                "id": case_id,
                "corpusKind": entry.get("corpusKind"),
                "recallAt5": recall,
                "mrr": mrr,
                "retrievedTop5": retrieved,
            }
        )

        print(f"retrieval-ir case={case_id} recall@5={recall:.4f} mrr={mrr:.4f}")

    mean_recall = sum(recalls) / len(recalls)
    mean_mrr = sum(mrrs) / len(mrrs)
    _write_report(
        report_path,
        rows=evaluated,
        mean_recall=mean_recall,
        mean_mrr=mean_mrr,
        min_recall=min_recall,
        min_mrr=min_mrr,
    )

    print(f"Wrote {report_path}")
    print(f"Mean recall@5: {mean_recall:.4f} (floor {min_recall:.4f})")
    print(f"Mean MRR: {mean_mrr:.4f} (floor {min_mrr:.4f})")

    if args.enforce and (mean_recall < min_recall or mean_mrr < min_mrr):
        print(
            f"::error::Retrieval IR below floor (recall@5={mean_recall:.4f}, mrr={mean_mrr:.4f})",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
