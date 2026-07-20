namespace ArchLucid.Core.Configuration;

/// <summary>Approved model catalog and unit-price caps for anonymous Quick Scan.</summary>
public sealed class QuickScanSafetyModelLimits
{
    public List<string> AllowedModelIds { get; set; } = [];

    public string DefaultModelId { get; set; } = string.Empty;

    public List<string> ApprovedFallbackModelIds { get; set; } = ["gpt-4o-mini-sample"];

    public decimal MaxInputPricePerMillionTokens { get; set; } = 10m;

    public decimal MaxOutputPricePerMillionTokens { get; set; } = 30m;

    public bool RejectClientModelSelection { get; set; } = true;
}
