"""RAG-V2 retrieval ablation profiles (TB-595, TB-878).

Mirrors ``Retrieval:Advanced`` feature flags from ``AdvancedRetrievalOptions``:
``EnableGraphRag``, ``EnableHyde``, ``EnableQueryRewrite``,
``EnableIterativeRetrieveCritiqueRetry``.

Offline golden-cohort ablation simulates each flag-off pass by filtering
retrieval hits attributed to disabled features (see ``ablation-attribution.v1.json``
next to each golden dataset). Does not invoke live retrieval or LLM expansion.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


FEATURE_GRAPH_RAG = "graphRag"
FEATURE_HYDE = "hyde"
FEATURE_QUERY_REWRITE = "queryRewrite"
FEATURE_ITERATIVE_RETRY = "iterativeRetry"

ALL_FEATURES: tuple[str, ...] = (
    FEATURE_GRAPH_RAG,
    FEATURE_HYDE,
    FEATURE_QUERY_REWRITE,
    FEATURE_ITERATIVE_RETRY,
)


@dataclass(frozen=True)
class RetrievalAblationProfile:
    """One ablation pass — maps to a ``Retrieval:Advanced`` flag combination."""

    key: str
    label: str
    enable_graph_rag: bool
    enable_hyde: bool
    enable_query_rewrite: bool
    enable_iterative_retrieve_critique_retry: bool = True

    def disabled_features(self) -> frozenset[str]:
        disabled: list[str] = []

        if not self.enable_graph_rag:
            disabled.append(FEATURE_GRAPH_RAG)

        if not self.enable_hyde:
            disabled.append(FEATURE_HYDE)

        if not self.enable_query_rewrite:
            disabled.append(FEATURE_QUERY_REWRITE)

        if not self.enable_iterative_retrieve_critique_retry:
            disabled.append(FEATURE_ITERATIVE_RETRY)

        return frozenset(disabled)


ABLATION_PROFILES: tuple[RetrievalAblationProfile, ...] = (
    RetrievalAblationProfile(
        key="all-on",
        label="All on (blended baseline)",
        enable_graph_rag=True,
        enable_hyde=True,
        enable_query_rewrite=True,
        enable_iterative_retrieve_critique_retry=True,
    ),
    RetrievalAblationProfile(
        key="graph-rag-off",
        label="EnableGraphRag=false",
        enable_graph_rag=False,
        enable_hyde=True,
        enable_query_rewrite=True,
    ),
    RetrievalAblationProfile(
        key="hyde-off",
        label="EnableHyde=false",
        enable_graph_rag=True,
        enable_hyde=False,
        enable_query_rewrite=True,
    ),
    RetrievalAblationProfile(
        key="query-rewrite-off",
        label="EnableQueryRewrite=false",
        enable_graph_rag=True,
        enable_hyde=True,
        enable_query_rewrite=False,
    ),
    RetrievalAblationProfile(
        key="iterative-retry-off",
        label="EnableIterativeRetrieveCritiqueRetry=false",
        enable_graph_rag=True,
        enable_hyde=True,
        enable_query_rewrite=True,
        enable_iterative_retrieve_critique_retry=False,
    ),
    RetrievalAblationProfile(
        key="all-advanced-off",
        label="All advanced off",
        enable_graph_rag=False,
        enable_hyde=False,
        enable_query_rewrite=False,
        enable_iterative_retrieve_critique_retry=False,
    ),
)


def profile_by_key(key: str) -> RetrievalAblationProfile | None:
    for profile in ABLATION_PROFILES:
        if profile.key == key:
            return profile

    return None


def load_hit_feature_attribution(payload: object) -> dict[str, dict[str, list[str]]]:
    """Parses ``ablation-attribution.v1.json`` hitFeatures map: caseId -> sourceId -> [features]."""

    if not isinstance(payload, dict):
        return {}

    raw_hits = payload.get("hitFeatures")

    if not isinstance(raw_hits, dict):
        return {}

    attribution: dict[str, dict[str, list[str]]] = {}

    for case_id, case_map in raw_hits.items():
        if not isinstance(case_map, dict):
            continue

        case_key = str(case_id)
        attribution[case_key] = {}

        for source_id, features in case_map.items():
            if not isinstance(features, list):
                continue

            normalized = [str(feature) for feature in features if str(feature) in ALL_FEATURES]

            if normalized:
                attribution[case_key][str(source_id)] = normalized

    return attribution


def filter_hits_for_profile(
    hits: list[dict[str, object]],
    *,
    case_id: str,
    profile: RetrievalAblationProfile,
    attribution: Mapping[str, Mapping[str, list[str]]],
) -> list[dict[str, object]]:
    """Drops hits attributed to features disabled in ``profile``."""

    disabled = profile.disabled_features()

    if not disabled:
        return hits

    case_attribution = attribution.get(case_id, {})

    filtered: list[dict[str, object]] = []

    for hit in hits:
        source_id = str(hit.get("sourceId") or "")
        hit_features = case_attribution.get(source_id, [])

        if any(feature in disabled for feature in hit_features):
            continue

        filtered.append(hit)

    return filtered


def build_ablation_delta_rows(
    profile_metrics: list[dict[str, object]],
    *,
    baseline_key: str = "all-on",
) -> list[dict[str, object]]:
    """Builds per-profile delta rows vs the all-on baseline positive readiness ratio."""

    baseline = next((row for row in profile_metrics if row.get("profileKey") == baseline_key), None)

    if baseline is None:
        return []

    baseline_positive = float(baseline.get("positiveReadinessSupportRatio") or 0.0)
    baseline_combined = float(baseline.get("combinedDiagnosticSupportRatio") or 0.0)
    rows: list[dict[str, object]] = []

    for row in profile_metrics:
        profile_key = str(row.get("profileKey") or "")
        positive = float(row.get("positiveReadinessSupportRatio") or 0.0)
        combined = float(row.get("combinedDiagnosticSupportRatio") or 0.0)

        rows.append(
            {
                "profileKey": profile_key,
                "profileLabel": row.get("profileLabel"),
                "positiveReadinessSupportRatio": positive,
                "positiveDeltaVsAllOn": positive - baseline_positive,
                "combinedDiagnosticSupportRatio": combined,
                "combinedDeltaVsAllOn": combined - baseline_combined,
                "hitsFiltered": int(row.get("hitsFiltered") or 0),
                "casesWithFilteredHits": int(row.get("casesWithFilteredHits") or 0),
            }
        )

    return rows
