namespace ArchLucid.Core.AiUsage;

/// <summary>Budget categories for tenant AI usage reporting and enforcement.</summary>
public enum AiUsageFeature
{
    ArchitectureGeneration = 0,

    ReviewAnalysis = 1,

    EvidenceQa = 2,

    EvidenceIndexing = 3,

    Comparison = 4,

    ReportGeneration = 5,

    QuickScan = 6,
}
