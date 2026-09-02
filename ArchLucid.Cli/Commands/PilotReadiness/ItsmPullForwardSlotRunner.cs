namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class ItsmPullForwardSlotRunner : PilotReadinessSlotRunnerBase, IPilotReadinessSlotRunner
{
    public async Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        ItsmPullForwardOptions childOptions = new()
        {
            IncludeApi = context.Options.IncludeApi,
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        ItsmPullForwardRunner runner = new();
        ItsmPullForwardReport report = runner.Run(context.RepositoryRoot, childOptions);

        if (childOptions.IncludeApi)
        {
            if (context.HttpClient is null)
                throw new InvalidOperationException("ITSM pull-forward live API mode requires a configured HTTP client.");

            string baseUrl = context.HttpClient.BaseAddress!.ToString().Trim().TrimEnd('/');
            PilotPreflightRunner preflightRunner = new(context.HttpClient);
            PilotPreflightReport preflightReport = await preflightRunner.RunAsync(
                baseUrl,
                [],
                new PilotPreflightOptions { IncludeItsm = true },
                cancellationToken);
            PilotPreflightStepResult? itsmStep = preflightReport.Steps.FirstOrDefault(static step => step.Name == "itsm-health");

            if (itsmStep is not null)
            {
                List<ItsmPullForwardCheckResult> checks = report.Checks.ToList();
                checks.Add(ItsmPullForwardRunner.BuildApiHealthCheck(itsmStep));
                report = new ItsmPullForwardReport
                {
                    RepositoryRoot = report.RepositoryRoot,
                    LedgerDirectory = report.LedgerDirectory,
                    BaseUrl = baseUrl,
                    GeneratedUtc = report.GeneratedUtc,
                    Recommendation = report.Recommendation,
                    Checks = checks,
                    Triggers = report.Triggers,
                    LedgerFilesScanned = report.LedgerFilesScanned,
                };
            }
            else
            {
                report = new ItsmPullForwardReport
                {
                    RepositoryRoot = report.RepositoryRoot,
                    LedgerDirectory = report.LedgerDirectory,
                    BaseUrl = baseUrl,
                    GeneratedUtc = report.GeneratedUtc,
                    Recommendation = report.Recommendation,
                    Checks = report.Checks,
                    Triggers = report.Triggers,
                    LedgerFilesScanned = report.LedgerFilesScanned,
                };
            }
        }

        string artifactKey = ItsmPullForwardOutputPaths.ResolveArtifactKey(report);
        ItsmPullForwardOutputResolution outputPaths =
            ItsmPullForwardOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        ItsmPullForwardReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteItsmPullForwardAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        string modeLabel = childOptions.IncludeApi ? "live-api" : "offline-ledger";

        return BuildSlotResult(
            PilotReadinessBundleSlots.ItsmPullForwardGate,
            "ITSM pull-forward gate",
            PilotReadinessBundleVerdictMapper.FromItsmPullForward(finalReport),
            $"Recommendation {finalReport.Recommendation}; mode {modeLabel}; {finalReport.Triggers.ActivatedTriggerCount} activated trigger(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }
}
