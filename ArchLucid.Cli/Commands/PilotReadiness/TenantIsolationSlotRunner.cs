namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class TenantIsolationSlotRunner : PilotReadinessSlotRunnerBase, IPilotReadinessSlotRunner
{
    private const string OfflineTenantIsolationManifestRelative =
        "fixtures/tenant-isolation/offline-release-train-manifest.v1.json";

    public async Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        TenantIsolationNegativeTestOptions childOptions = new()
        {
            RunId = context.Options.RunId,
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
            ManifestPath = string.IsNullOrWhiteSpace(context.Options.RunId)
                ? Path.Combine(context.RepositoryRoot, OfflineTenantIsolationManifestRelative)
                : null,
        };
        TenantIsolationNegativeTestRunner runner = new();
        TenantIsolationNegativeTestReport report;

        if (!string.IsNullOrWhiteSpace(childOptions.RunId))
        {
            if (context.HttpClient is null)
                throw new InvalidOperationException("Tenant-isolation live API mode requires a configured HTTP client.");

            (string tenantId, string workspaceId, string projectId) =
                TenantIsolationNegativeTestRunner.ResolveAlternateScope(childOptions);

            string baseUrl = context.HttpClient.BaseAddress!.ToString().Trim().TrimEnd('/');
            using HttpClient alternateClient = CliAuthorizedHttpClient.Create(baseUrl, context.Config);
            CliScopeHeaders.ApplyExplicit(alternateClient, tenantId, workspaceId, projectId);

            report = await runner.RunLiveAsync(
                context.RepositoryRoot,
                context.HttpClient,
                alternateClient,
                childOptions,
                cancellationToken);
        }
        else
        {
            report = runner.RunOffline(context.RepositoryRoot, childOptions);
        }

        string artifactKey = TenantIsolationNegativeTestOutputPaths.ResolveArtifactKey(report);
        TenantIsolationNegativeTestOutputResolution outputPaths =
            TenantIsolationNegativeTestOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        TenantIsolationNegativeTestReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteTenantIsolationAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        string modeLabel = finalReport.LiveApiMode ? "live-api" : "offline-fixture";

        return BuildSlotResult(
            PilotReadinessBundleSlots.TenantIsolationNegativeTest,
            "Tenant-isolation negative test",
            PilotReadinessBundleVerdictMapper.FromTenantIsolation(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; mode {modeLabel}; {finalReport.Probes.Count} probe(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }
}
