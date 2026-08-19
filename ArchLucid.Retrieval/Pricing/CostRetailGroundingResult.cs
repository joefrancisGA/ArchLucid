using ArchLucid.Contracts.Common;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>Structured retail-price grounding block for the Cost agent (RAG-V1-003 / TB-603).</summary>
public sealed record CostRetailGroundingResult(
    string PromptBlock,
    IReadOnlyList<CostRetailCitationRow> CitedRows,
    bool GroundingMissing,
    bool SkippedRetailGrounding,
    CloudProvider? GroundedProvider);
