using ArchLucid.Contracts.Risk;

namespace ArchLucid.KnowledgeGraph.WafTradeoff;

public sealed class WafTradeoffCatalogEntry
{
    public string MechanismKey { get; set; } = null!;

    public string MechanismLabel { get; set; } = null!;

    public WafPillar GainedPillar { get; set; }

    public WafPillar SacrificedPillar { get; set; }

    public List<string> DetectionSignatures { get; set; } = [];

    public string? CounterfactualKey { get; set; }

    public RiskConsequence DefaultConsequence { get; set; }

    public ReversibilityClass DefaultReversibility { get; set; }
}
