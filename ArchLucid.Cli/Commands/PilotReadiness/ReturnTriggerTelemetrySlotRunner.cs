namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class ReturnTriggerTelemetrySlotRunner : PilotReadinessSlotRunnerBase, IPilotReadinessSlotRunner
{
    public async Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        ReturnTriggerTelemetryOptions childOptions = new()
        {
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        ReturnTriggerTelemetryRules rules = ReturnTriggerTelemetryRulesLoader.Load(childOptions.RulesPath);
        ReturnTriggerTelemetryRunner runner = new();
        ReturnTriggerTelemetryReport report = runner.Run(context.RepositoryRoot, childOptions, rules);
        string artifactKey = ReturnTriggerTelemetryOutputPaths.ResolveArtifactKey(report);
        ReturnTriggerTelemetryOutputResolution outputPaths =
            ReturnTriggerTelemetryOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        ReturnTriggerTelemetryReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteReturnTriggerAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.ReturnTriggerTelemetry,
            "Return-trigger telemetry",
            PilotReadinessBundleVerdictMapper.FromReturnTrigger(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; ledger `{finalReport.LedgerDirectory}`.",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }
}
