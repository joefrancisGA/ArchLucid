namespace ArchLucid.Core.Configuration;

/// <summary>Host-level AI usage controls for demo, trial, and paid workspaces.</summary>
public sealed class AiUsageControlsOptions
{
    public const string SectionName = "AiUsageControls";

    public bool DemoMode
    {
        get;
        set;
    }

    public bool TrialMode
    {
        get;
        set;
    } = true;

    public bool AllowCustomerAiProvider
    {
        get;
        set;
    }

    public decimal DefaultTrialAiBudgetUsd
    {
        get;
        set;
    } = 10m;

    public decimal PublicDemoDailyAiLimitUsd
    {
        get;
        set;
    } = 2m;

    public decimal PublicDemoMonthlyAiBudgetUsd
    {
        get;
        set;
    } = 5m;

    public bool HardStopEnabled
    {
        get;
        set;
    } = true;

    public string[] PublicDemoTenantSlugs
    {
        get;
        set;
    } =
    [
        "claims-intake-showcase",
        "contoso",
        "demo",
    ];

    public Dictionary<string, decimal> PublicDemoFeatureDailyLimitUsd
    {
        get;
        set;
    } = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ArchitectureGeneration"] = 0m,
        ["ReviewAnalysis"] = 0.50m,
        ["EvidenceQa"] = 1.00m,
        ["EvidenceIndexing"] = 0m,
        ["Comparison"] = 0.25m,
        ["ReportGeneration"] = 0.25m,
    };

    public int DemoPromptCacheMaxEntries
    {
        get;
        set;
    } = 512;
}
