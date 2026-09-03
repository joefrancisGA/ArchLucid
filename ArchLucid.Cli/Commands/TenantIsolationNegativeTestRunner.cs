namespace ArchLucid.Cli.Commands;

internal sealed class TenantIsolationNegativeTestRunner
{
    private readonly TenantIsolationNegativeTestOfflineRunner _offlineRunner = new();
    private readonly TenantIsolationNegativeTestLiveRunner _liveRunner = new();

    internal TenantIsolationNegativeTestReport RunOffline(string repositoryRoot, TenantIsolationNegativeTestOptions options)
    {
        TenantIsolationNegativeTestOfflineRunResult result = _offlineRunner.Run(repositoryRoot, options);

        return BuildReport(
            repositoryRoot,
            baseUrl: null,
            runId: result.PrimaryRunId,
            alternateTenantId: result.AlternateTenantId,
            alternateWorkspaceId: result.AlternateWorkspaceId,
            alternateProjectId: result.AlternateProjectId,
            liveApiMode: false,
            result.Probes);
    }

    internal async Task<TenantIsolationNegativeTestReport> RunLiveAsync(
        string repositoryRoot,
        HttpClient primaryClient,
        HttpClient alternateClient,
        TenantIsolationNegativeTestOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);

        TenantIsolationNegativeTestLiveRunResult result = await _liveRunner.RunAsync(
            primaryClient,
            alternateClient,
            options,
            cancellationToken);

        return BuildReport(
            repositoryRoot,
            result.BaseUrl,
            result.RunId,
            result.AlternateTenantId,
            result.AlternateWorkspaceId,
            result.AlternateProjectId,
            liveApiMode: true,
            result.Probes);
    }

    internal static (string TenantId, string WorkspaceId, string ProjectId) ResolveAlternateScope(
        TenantIsolationNegativeTestOptions options) =>
        TenantIsolationNegativeTestLiveRunner.ResolveAlternateScope(options);

    private static TenantIsolationNegativeTestReport BuildReport(
        string repositoryRoot,
        string? baseUrl,
        string? runId,
        string? alternateTenantId,
        string? alternateWorkspaceId,
        string? alternateProjectId,
        bool liveApiMode,
        IReadOnlyList<TenantIsolationNegativeTestProbeResult> probes)
    {
        TenantIsolationNegativeTestVerdict overallVerdict =
            TenantIsolationNegativeTestAggregator.DeriveOverallVerdict(probes, liveApiMode);

        return new TenantIsolationNegativeTestReport
        {
            RepositoryRoot = repositoryRoot,
            BaseUrl = baseUrl,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = overallVerdict,
            PrimaryRunId = runId,
            AlternateTenantId = alternateTenantId,
            AlternateWorkspaceId = alternateWorkspaceId,
            AlternateProjectId = alternateProjectId,
            LiveApiMode = liveApiMode,
            UnexpectedSuccessCount = TenantIsolationNegativeTestAggregator.CountUnexpectedSuccesses(probes),
            Probes = probes,
        };
    }
}
