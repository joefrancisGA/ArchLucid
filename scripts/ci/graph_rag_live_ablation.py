"""TB-883 — Graph-RAG live-model ablation on committed ``*.real.json`` exemplars.

Recomputes citation support ratio with ``KnowledgeGraphNodeNeighbor`` hits filtered out
(mirroring ``EnableGraphRag=false``) using the same heuristic as ``eval_agent_faithfulness``.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from eval_agent_faithfulness import _evaluate_case  # noqa: E402

GRAPH_RAG_NEIGHBOR_SOURCE_TYPE = "KnowledgeGraphNodeNeighbor"

_RETRIEVAL_HIT_FIELDS = ("chunkId", "sourceType", "corpusKind", "score")


def extract_agent_output_text(doc: dict[str, Any]) -> str:
    """Concatenates claims/findings/evidence text used for offline citation overlap."""

    parts: list[str] = []

    claims = doc.get("claims")

    if isinstance(claims, list):
        for claim in claims:
            if not isinstance(claim, dict):
                continue

            detail = claim.get("detail")

            if isinstance(detail, str) and detail.strip():
                parts.append(detail)

            refs = claim.get("evidenceRefs")

            if isinstance(refs, list):
                parts.extend(str(ref) for ref in refs if str(ref).strip())

    findings = doc.get("findings")

    if isinstance(findings, list):
        for finding in findings:
            if not isinstance(finding, dict):
                continue

            for key in ("description", "recommendation", "message", "title", "detail"):
                value = finding.get(key)

                if isinstance(value, str) and value.strip():
                    parts.append(value)

    evidence_refs = doc.get("evidenceRefs")

    if isinstance(evidence_refs, list):
        parts.extend(str(ref) for ref in evidence_refs if str(ref).strip())

    return " ".join(parts)


def normalize_retrieval_hits(raw_hits: object) -> list[dict[str, object]] | None:
    """Returns normalized hit dicts, or ``None`` when ``retrievalHits`` is absent."""

    if raw_hits is None:
        return None

    if not isinstance(raw_hits, list):
        raise ValueError("retrievalHits must be an array when present")

    normalized: list[dict[str, object]] = []

    for index, hit in enumerate(raw_hits):
        if not isinstance(hit, dict):
            raise ValueError(f"retrievalHits[{index}] must be an object")

        chunk_id = str(hit.get("chunkId") or "").strip()

        if not chunk_id:
            raise ValueError(f"retrievalHits[{index}] missing chunkId")

        source_type = str(hit.get("sourceType") or "").strip()

        if not source_type:
            raise ValueError(f"retrievalHits[{index}] missing sourceType")

        normalized.append(
            {
                "chunkId": chunk_id,
                "sourceId": str(hit.get("sourceId") or chunk_id),
                "sourceType": source_type,
                "corpusKind": str(hit.get("corpusKind") or "Conversation"),
                "title": str(hit.get("title") or hit.get("sourceId") or chunk_id),
                "score": float(hit.get("score") or 0.0),
            }
        )

    return normalized


def filter_graph_rag_neighbor_hits(hits: list[dict[str, object]]) -> tuple[list[dict[str, object]], int]:
    """Drops hits whose ``sourceType`` is ``KnowledgeGraphNodeNeighbor``."""

    filtered: list[dict[str, object]] = []
    removed = 0

    for hit in hits:
        source_type = str(hit.get("sourceType") or "")

        if source_type == GRAPH_RAG_NEIGHBOR_SOURCE_TYPE:
            removed += 1
            continue

        filtered.append(hit)

    return filtered, removed


def compute_citation_support_ratio(hits: list[dict[str, object]], agent_output: str) -> float:
    """Support ratio for one exemplar pass (0.0–1.0; empty hits → 1.0)."""

    _, _, ratio, _, _, _ = _evaluate_case(hits, agent_output)
    return float(ratio)


def summarize_exemplar_graph_rag_ablation(
    *,
    exemplar_path: Path,
    doc: dict[str, Any],
) -> dict[str, Any] | None:
    """Returns per-exemplar ablation metrics, or ``None`` when ``retrievalHits`` is absent."""

    hits = normalize_retrieval_hits(doc.get("retrievalHits"))

    if hits is None:
        return None

    agent_output = extract_agent_output_text(doc)
    all_on_ratio = compute_citation_support_ratio(hits, agent_output)
    filtered_hits, neighbors_removed = filter_graph_rag_neighbor_hits(hits)
    graph_rag_off_ratio = compute_citation_support_ratio(filtered_hits, agent_output)

    return {
        "exemplarFile": exemplar_path.name,
        "allOnSupportRatio": round(all_on_ratio, 6),
        "graphRagOffSupportRatio": round(graph_rag_off_ratio, 6),
        "deltaVsAllOn": round(graph_rag_off_ratio - all_on_ratio, 6),
        "retrievalHitCount": len(hits),
        "graphRagNeighborHitsRemoved": neighbors_removed,
    }


def load_exemplar_doc(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path.name}: root must be a JSON object")

    return payload


def summarize_graph_rag_ablation_from_paths(exemplar_paths: list[Path]) -> dict[str, Any]:
    """Rolls up Graph-RAG ablation across configured real-mode exemplars."""

    rows: list[dict[str, Any]] = []
    skipped_without_hits: list[str] = []

    for path in exemplar_paths:
        if not path.is_file():
            continue

        try:
            doc = load_exemplar_doc(path)
        except (json.JSONDecodeError, ValueError) as exc:
            print(f"::warning::Skipping {path.name} for Graph-RAG ablation: {exc}")
            continue

        if doc.get("retrievalHits") is None:
            skipped_without_hits.append(path.name)
            print(
                f"::notice::Skipping Graph-RAG ablation for {path.name}: "
                "retrievalHits not present on exemplar.",
            )
            continue

        try:
            row = summarize_exemplar_graph_rag_ablation(exemplar_path=path, doc=doc)
        except ValueError as exc:
            print(f"::warning::Skipping {path.name} for Graph-RAG ablation: {exc}")
            continue

        if row is not None:
            rows.append(row)

    if not rows:
        return {
            "status": "insufficient_data",
            "interpretation": (
                "No committed real-mode exemplars carry retrievalHits; "
                "Graph-RAG live-model ablation cannot be computed offline yet."
            ),
            "exemplarsWithRetrievalHits": 0,
            "exemplarsSkippedWithoutHits": len(skipped_without_hits),
            "skippedWithoutHits": skipped_without_hits,
            "rows": [],
            "meanAllOnSupportRatio": None,
            "meanGraphRagOffSupportRatio": None,
            "meanDeltaVsAllOn": None,
        }

    all_on_mean = sum(float(row["allOnSupportRatio"]) for row in rows) / len(rows)
    graph_off_mean = sum(float(row["graphRagOffSupportRatio"]) for row in rows) / len(rows)
    delta_mean = graph_off_mean - all_on_mean

    return {
        "status": "computed",
        "interpretation": (
            "Citation support ratio recomputed offline by filtering "
            f"sourceType={GRAPH_RAG_NEIGHBOR_SOURCE_TYPE!r} hits (EnableGraphRag=false simulation). "
            "Negative mean Δ vs all-on means Graph-RAG neighbor expansion contributed cited hits "
            "on captured live-model exemplars; positive Δ means neighbors were uncited or diluted ratio."
        ),
        "exemplarsWithRetrievalHits": len(rows),
        "exemplarsSkippedWithoutHits": len(skipped_without_hits),
        "skippedWithoutHits": skipped_without_hits,
        "rows": rows,
        "meanAllOnSupportRatio": round(all_on_mean, 6),
        "meanGraphRagOffSupportRatio": round(graph_off_mean, 6),
        "meanDeltaVsAllOn": round(delta_mean, 6),
    }
