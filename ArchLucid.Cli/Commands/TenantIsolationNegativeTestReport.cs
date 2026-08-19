namespace ArchLucid.Cli.Commands;

internal sealed class TenantIsolationNegativeTestReport
{
    public string RepositoryRoot { get; init; } = string.Empty;

    public string? BaseUrl { get; init; }

    public DateTime GeneratedUtc { get; init; }

    public TenantIsolationNegativeTestVerdict OverallVerdict { get; init; }

    public string? PrimaryRunId { get; init; }

    public string? AlternateTenantId { get; init; }

    public string? AlternateWorkspaceId { get; init; }

    public string? AlternateProjectId { get; init; }

    public bool LiveApiMode { get; init; }

    public int UnexpectedSuccessCount { get; init; }

    public IReadOnlyList<TenantIsolationNegativeTestProbeResult> Probes { get; init; } = [];

    public string? JsonArtifactPath { get; init; }

    public string? MarkdownArtifactPath { get; init; }

    internal TenantIsolationNegativeTestReport WithOutputMetadata(
        string? jsonArtifactPath,
        string? markdownArtifactPath) =>
        new()
        {
            RepositoryRoot = RepositoryRoot,
            BaseUrl = BaseUrl,
            GeneratedUtc = GeneratedUtc,
            OverallVerdict = OverallVerdict,
            PrimaryRunId = PrimaryRunId,
            AlternateTenantId = AlternateTenantId,
            AlternateWorkspaceId = AlternateWorkspaceId,
            AlternateProjectId = AlternateProjectId,
            LiveApiMode = LiveApiMode,
            UnexpectedSuccessCount = UnexpectedSuccessCount,
            Probes = Probes,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
        };
}
