using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class PilotProofPacketCommand
{
    /// <summary>
    ///     Shared proof-packet writer used by <c>pilot proof-packet</c> and <c>try --sponsor-packet</c>.
    /// </summary>
    internal static async Task<PilotProofPacketWriteOutcome> WriteFolderAsync(
        string runId,
        string apiBaseUrl,
        string outputDirectory,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        TextWriter errorWriter,
        CancellationToken cancellationToken,
        bool skipClaimLint = false)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiBaseUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);
        ArgumentNullException.ThrowIfNull(errorWriter);

        string normalized = apiBaseUrl.Trim().TrimEnd('/');
        using CliHttpProbeSession session = CliHttpProbeSession.ForApi(normalized, config, TimeSpan.FromMinutes(3));
        IBuyerProofArtifactCollector collector = new BuyerProofArtifactCollector();
        BuyerProofArtifactCollectionResult collection = await collector.CollectAsync(runId, session, includePdf: false, cancellationToken);

        if (collection.Status == BuyerProofArtifactCollectionStatus.NotFound)
        {
            await errorWriter.WriteLineAsync($"Run '{collection.RunId}' was not found (or is out of scope).");

            return new PilotProofPacketWriteOutcome(CliExitCode.UsageError, outputDirectory);
        }

        if (collection.Status == BuyerProofArtifactCollectionStatus.GateFailed)
        {
            await errorWriter.WriteLineAsync(collection.ErrorMessage);

            return new PilotProofPacketWriteOutcome(CliExitCode.UsageError, outputDirectory);
        }

        if (collection.Status != BuyerProofArtifactCollectionStatus.Success || collection.Artifacts is null)
        {
            await errorWriter.WriteLineAsync(collection.ErrorMessage);

            return new PilotProofPacketWriteOutcome(CliExitCode.OperationFailed, outputDirectory);
        }

        string deltasJson = collection.Artifacts.DeltasJson;
        bool demoWarning = collection.Artifacts.DemoWarning;
        string? firstValueMarkdown = collection.Artifacts.FirstValueMarkdown;

        string dir = BuyerPacketFolderWriter.EnsureDirectory(outputDirectory);

        await BuyerPacketFolderWriter.WriteJsonRawAsync(dir, "run-evidence.json", deltasJson, cancellationToken);

        await PilotProofPacketRoiArtifacts.WriteAsync(dir, deltasJson, cancellationToken);

        bool pilotStrictSatisfied = PilotProofPacketRoiArtifacts.TryResolvePilotStrictSatisfied(deltasJson);

        if (!pilotStrictSatisfied)
        {
            await errorWriter.WriteLineAsync(
                "WARN: PilotStrict evidence is not satisfied — sponsor handoff is not recommended (see limitations.md).");
        }

        session.SetAcceptJson();

        HttpClient http = session.Http;

        using HttpResponseMessage aggregateResponse =
            await http.GetAsync($"v1/explain/runs/{Uri.EscapeDataString(runId)}/aggregate", cancellationToken);

        string? aggregateJson = aggregateResponse.IsSuccessStatusCode
            ? await aggregateResponse.Content.ReadAsStringAsync(cancellationToken)
            : null;

        session.SetAcceptMarkdown();

        if (firstValueMarkdown is not null)
        {
            string summaryBody = PrependProofSummaryRoiLink(firstValueMarkdown, dir);

            await BuyerPacketFolderWriter.WriteTextAsync(dir, "proof-summary.md", summaryBody, cancellationToken);
        }

        ArchLucidApiClient client = new(normalized, config);
        IReadOnlyList<string> auditIds = await client.TryFetchRecentAuditEventIdsAsync(runId, 10, cancellationToken);
        IReadOnlyList<string> artifactIds = await client.TryListArtifactIdsForRunAsync(runId, cancellationToken);

        string auditSampleJson = JsonSerializer.Serialize(
            new
            {
                schema = "archlucid.proof-packet.audit-sample.v1",
                runId,
                capturedUtc = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
                auditEventIds = auditIds,
                note = "Event ids only — no payloads or secrets.",
            },
            BuyerPacketFolderWriter.JsonWriteIndented);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "audit-sample.json", auditSampleJson, cancellationToken);

        string artifactManifestJson = JsonSerializer.Serialize(
            new
            {
                schema = "archlucid.proof-packet.artifact-manifest.v1",
                runId,
                capturedUtc = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
                artifactIds,
            },
            BuyerPacketFolderWriter.JsonWriteIndented);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "artifact-manifest.json", artifactManifestJson, cancellationToken);

        string environmentJson = PilotProofPacketEnvironmentBuilder.BuildJson(config, normalized, deltasJson, demoWarning, pilotStrictSatisfied);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "environment.json", environmentJson, cancellationToken);

        string? structuralExecutionModeLabel =
            PilotProofPacketStructuralExecutionModeFormatter.TryResolveLabelFromDeltasJson(deltasJson);

        string limitations = PilotProofPacketLimitationsBuilder.BuildMarkdown(demoWarning, deltasJson, aggregateJson, structuralExecutionModeLabel);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "limitations.md", limitations, cancellationToken);

        string commercialReadiness = PilotProofPacketCommercialReadinessBuilder.BuildJson(
            runId,
            deltasJson,
            demoWarning,
            pilotStrictSatisfied,
            aggregateJson);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "quote-to-proof-readiness.json", commercialReadiness, cancellationToken);

        string governanceSummary = PilotProofPacketGovernanceArtifacts.BuildGovernanceOutcomeSummaryJson(
            runId,
            deltasJson,
            pilotStrictSatisfied);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "governance-outcome-summary.json", governanceSummary, cancellationToken);

        string auditSummary = PilotProofPacketGovernanceArtifacts.BuildAuditEvidenceSummaryJson(
            runId,
            auditIds,
            deltasJson);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "audit-evidence-summary.json", auditSummary, cancellationToken);

        string auditSummaryMarkdown = PilotProofPacketGovernanceArtifacts.BuildAuditEvidenceSummaryMarkdown(
            runId,
            auditIds,
            deltasJson);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "audit-evidence-summary.md", auditSummaryMarkdown, cancellationToken);

        string dataConsistencyJson = PilotProofPacketDataConsistencyArtifacts.BuildSummaryJson(runId, deltasJson);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "data-consistency-summary.json", dataConsistencyJson, cancellationToken);

        string dataConsistencyMarkdown = PilotProofPacketDataConsistencyArtifacts.BuildSummaryMarkdown(runId, deltasJson);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "data-consistency-summary.md", dataConsistencyMarkdown, cancellationToken);

        string scaleEnvelope = PilotProofPacketGovernanceArtifacts.BuildScaleEnvelopeEvidenceJson(
            runId,
            deltasJson,
            Support.SupportBundleRedactor.RedactHttpUrl(normalized));
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "scale-envelope-evidence.json", scaleEnvelope, cancellationToken);

        string redactionManifest = PilotProofPacketRedactionManifestBuilder.BuildJson(
            redactionPassApplied: true,
            outputDirectory: dir);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "redaction-manifest.json", redactionManifest, cancellationToken);

        string indexJson = PilotProofPacketIndexBuilder.BuildJson(
            runId,
            pilotStrictSatisfied,
            demoWarning,
            structuralExecutionModeLabel);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "sponsor-proof-packet-index.json", indexJson, cancellationToken);

        string indexMarkdown = PilotProofPacketIndexBuilder.BuildMarkdown(
            runId,
            pilotStrictSatisfied,
            structuralExecutionModeLabel);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "sponsor-proof-packet-index.md", indexMarkdown, cancellationToken);

        await BuyerPacketFolderWriter.WriteTextAsync(
            dir,
            ProofPacketSourceLabelsBuilder.FileName,
            ProofPacketSourceLabelsBuilder.Build(runId),
            cancellationToken);

        int claimLintExit = BuyerPacketFolderWriter.RunClaimLintOrFail(dir, skipClaimLint, errorWriter);

        if (claimLintExit != CliExitCode.Success)
            return new PilotProofPacketWriteOutcome(claimLintExit, dir);

        return new PilotProofPacketWriteOutcome(CliExitCode.Success, dir);
    }
}
