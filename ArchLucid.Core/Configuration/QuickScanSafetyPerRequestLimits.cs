namespace ArchLucid.Core.Configuration;

/// <summary>Per-request bounds for anonymous Quick Scan — client-supplied limits are never trusted.</summary>
public sealed class QuickScanSafetyPerRequestLimits
{
    public int MaxRequestBodyBytes { get; set; } = 65_536;

    public int MaxSystemNameCharacters { get; set; } = 100;

    public int MaxDescriptionCharacters { get; set; } = 1_500;

    public int MaxInputTokens { get; set; } = 4_000;

    public int MaxOutputTokens { get; set; } = 1_200;

    public decimal MaxEstimatedCostPerRequest { get; set; } = 0.05m;

    public int MaxModelCallsPerRequest { get; set; } = 1;

    public int MaxToolCallsPerRequest { get; set; }

    public int MaxRetriesPerModelCall { get; set; }

    public int MaxTotalRetriesPerRequest { get; set; }

    public int MaxExecutionSeconds { get; set; } = 45;
}
