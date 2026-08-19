using ArchLucid.Contracts.Common;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>One structured retail-price citation row for Cost-agent grounding (RAG-V1-003 / TB-603).</summary>
public sealed record CostRetailCitationRow(
    CloudProvider CloudProvider,
    string ServiceName,
    string Region,
    string Sku,
    decimal EstimatedMonthlyUsd,
    string CurrencyCode,
    bool IsHeuristicFallback = false);
