namespace ArchLucid.Cli.Commands;

/// <summary>Structured config lint output for CLI JSON/Markdown and first-pilot proof artifacts.</summary>
internal sealed class ConfigLintReportDocument
{
    public string ProfileName { get; init; } = string.Empty;

    public string HostingEnvironmentName { get; init; } = string.Empty;

    public bool Ok { get; init; }

    /// <summary>READY, WARN, or HOLD aligned with first-pilot proof disposition.</summary>
    public string Disposition { get; init; } = "READY";

    public bool SponsorHandoffRecommended { get; init; }

    public IReadOnlyList<ConfigLintReportFinding> BlockingFindings { get; init; } = [];

    public IReadOnlyList<ConfigLintReportFinding> AdvisoryFindings { get; init; } = [];

    public IReadOnlyList<ConfigLintReportCheckCategory> CheckCategories { get; init; } = [];
}
