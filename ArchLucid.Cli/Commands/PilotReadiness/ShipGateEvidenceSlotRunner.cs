namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class ShipGateEvidenceSlotRunner : PilotReadinessSlotRunnerBase, IPilotReadinessSlotRunner
{
    public async Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (string.IsNullOrWhiteSpace(context.Options.RunId))
        {
            return new PilotReadinessBundleSlotResult
            {
                SlotKey = PilotReadinessBundleSlots.ShipGateEvidence,
                DisplayName = "Ship-gate evidence",
                Verdict = PilotReadinessBundleSlotVerdict.Skipped,
                Evidence =
                    "Live ship-gate evidence requires --run-id; re-run with a representative completed first-review run id.",
            };
        }

        if (context.HttpClient is null)
            throw new InvalidOperationException("Ship-gate evidence requires a configured HTTP client.");

        ShipGateEvidenceOptions childOptions = new()
        {
            RunId = context.Options.RunId.Trim(),
            UiBaseUrl = context.Options.UiBaseUrl,
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        ShipGateUiBaseUrlResolution uiOrigin = ShipGateUiBaseUrlResolver.Resolve(context.RawArgs, context.Config);
        ShipGateEvidenceRunner runner = new(context.HttpClient, context.Config);
        ShipGateEvidenceReport report = await runner.RunAsync(
            childOptions.RunId,
            uiOrigin.BaseUrl,
            uiOrigin.Source,
            childOptions.ToTenantIsolationOptions(),
            childOptions.SkipClaimLint,
            cancellationToken);
        ShipGateEvidenceOutputResolution outputPaths =
            ShipGateEvidenceOutputPaths.Resolve(childOptions, context.RepositoryRoot, report.RunId);
        ShipGateEvidenceReport finalReport = report.WithOutputMetadata(
            context.RepositoryRoot,
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteShipGateAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.ShipGateEvidence,
            "Ship-gate evidence",
            PilotReadinessBundleVerdictMapper.FromShipGate(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; run `{finalReport.RunId}`; {finalReport.Gates.Count} gate(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }
}
