using System.Globalization;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid pilot proof-packet</c> — buyer-safe folder with assessment filenames after a committed run.
/// </summary>
internal static class PilotProofPacketCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        string? runId = null;
        string? outputDirectory = null;
        bool skipClaimLint = false;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--skip-claim-lint", StringComparison.OrdinalIgnoreCase))
            {
                skipClaimLint = true;

                continue;
            }

            if (string.Equals(token, "--out", StringComparison.OrdinalIgnoreCase)
                || string.Equals(token, "-o", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    await Console.Error.WriteLineAsync("Missing value for --out.");

                    return CliExitCode.UsageError;
                }

                outputDirectory = args[++i];

                continue;
            }

            if (token.StartsWith('-'))
            {
                await Console.Error.WriteLineAsync($"Unexpected flag: {token}");

                return CliExitCode.UsageError;
            }

            if (runId is not null)
            {
                await Console.Error.WriteLineAsync("Only one run id is supported.");

                return CliExitCode.UsageError;
            }

            runId = token;
        }

        if (string.IsNullOrWhiteSpace(runId))
        {
            await Console.Error.WriteLineAsync("Usage: archlucid pilot proof-packet <runId> [--out <dir>]");

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome outcome = await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken);

        if (outcome != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(outcome);

        string normalized = baseUrl.Trim().TrimEnd('/');
        string resolvedOutputDirectory = outputDirectory
                                         ?? Path.Combine(Directory.GetCurrentDirectory(), "proof-packet", runId);

        PilotProofPacketWriteOutcome writeOutcome = await WriteFolderAsync(
            runId,
            normalized,
            resolvedOutputDirectory,
            config,
            Console.Error,
            cancellationToken,
            skipClaimLint);

        if (writeOutcome.ExitCode == CliExitCode.Success)
            await Console.Out.WriteLineAsync($"Wrote buyer proof packet folder: {writeOutcome.OutputDirectory}");

        return writeOutcome.ExitCode;
    }

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

        string environmentJson = BuildEnvironmentJson(config, normalized, deltasJson, demoWarning, pilotStrictSatisfied);
        await BuyerPacketFolderWriter.WriteTextAsync(dir, "environment.json", environmentJson, cancellationToken);

        string? structuralExecutionModeLabel =
            PilotProofPacketStructuralExecutionModeFormatter.TryResolveLabelFromDeltasJson(deltasJson);

        string limitations = BuildLimitationsMarkdown(demoWarning, deltasJson, aggregateJson, structuralExecutionModeLabel);
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

    private static string PrependProofSummaryRoiLink(string markdown, string outputDirectory)
    {
        string roiPath = Path.Combine(outputDirectory, "roi-metric-sources.md");

        if (!File.Exists(roiPath))
            return markdown;

        return "- ROI source catalog: [roi-metric-sources.md](roi-metric-sources.md)\n\n" + markdown;
    }

    private static string BuildEnvironmentJson(
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        string apiBaseRedacted,
        string deltasJson,
        bool demoWarning,
        bool pilotStrictSatisfied)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        string? structuralMode = null;

        if (root.TryGetProperty("structuralExecutionMode", out JsonElement modeEl))
        {
            structuralMode = modeEl.ValueKind switch
            {
                JsonValueKind.String => modeEl.GetString(),
                JsonValueKind.Number when modeEl.TryGetInt32(out int modeInt) => modeInt.ToString(CultureInfo.InvariantCulture),
                _ => null,
            };
        }

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = "archlucid.proof-packet.environment.v1",
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["apiBaseUrlRedacted"] = Support.SupportBundleRedactor.RedactHttpUrl(apiBaseRedacted),
            ["storageProviderSummary"] = "(see config-summary in support bundle — not duplicated here)",
            ["demoDataWarning"] = demoWarning,
            ["sponsorHandoffRecommended"] = pilotStrictSatisfied && !demoWarning,
            ["nextAction"] = pilotStrictSatisfied ? "PASS" : "HOLD",
            ["structuralExecutionMode"] = structuralMode ?? "(not captured)",
            ["skippedGates"] = "See limitations.md and first-pilot proof rollup for environment-wide gates not exercised by this run.",
        };

        return JsonSerializer.Serialize(payload, BuyerPacketFolderWriter.JsonWriteIndented);
    }

    private static string BuildLimitationsMarkdown(
        bool demoWarning,
        string deltasJson,
        string? aggregateJson,
        string? structuralExecutionModeLabel)
    {
        StringBuilder sb = new();
        sb.AppendLine("# Limitations");
        sb.AppendLine();
        sb.AppendLine("This proof packet summarizes one committed architecture review. It is buyer-safe by design (no secrets).");
        sb.AppendLine();
        sb.AppendLine(PilotProofPacketStructuralExecutionModeFormatter.BuildSponsorCaveatLine(structuralExecutionModeLabel));
        sb.AppendLine();

        if (demoWarning)
        {
            sb.AppendLine("- **Demo data warning:** Contoso/demo seed — do not quote as a customer outcome.");
            sb.AppendLine();
        }

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("proofPackageCompleteness", out JsonElement proof))
        {
            if (proof.TryGetProperty("agentOutputPilotStrictEvidenceSatisfied", out JsonElement strict)
                && strict.ValueKind == JsonValueKind.False)
            {
                sb.AppendLine("- **PilotStrict evidence:** not satisfied for this run — hold sponsor-safe real-mode wording.");
                sb.AppendLine();
            }
        }

        string roiFreshnessLine = PilotProofPacketRoiFreshnessEvaluator.BuildLimitationsLine(deltasJson, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(roiFreshnessLine))
        {
            sb.AppendLine($"- {roiFreshnessLine}");
            sb.AppendLine();
        }

        string? explanationLine = PilotProofPacketExplanationConfidenceEvaluator.BuildLimitationsLine(aggregateJson);

        if (!string.IsNullOrWhiteSpace(explanationLine))
        {
            sb.AppendLine($"- {explanationLine}");
            sb.AppendLine();
        }

        if (root.TryGetProperty("topFindingEvidenceChain", out JsonElement chainEl)
            && chainEl.ValueKind == JsonValueKind.Object
            && chainEl.TryGetProperty("confidenceLabel", out JsonElement confidenceEl)
            && confidenceEl.ValueKind == JsonValueKind.String)
        {
            string? confidence = confidenceEl.GetString();

            if (string.Equals(confidence, "Low", StringComparison.OrdinalIgnoreCase)
                || string.Equals(confidence, "Heuristic", StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine("- **Explanation / evidence chain:** top finding uses low-confidence or heuristic evidence — verify before sponsor send.");
                sb.AppendLine();
            }
        }

        sb.AppendLine("## Skipped or out-of-scope gates");
        sb.AppendLine();
        sb.AppendLine("- SOC 2 CPA attestation, third-party pen test, and live Marketplace checkout are deferred procurement items.");
        sb.AppendLine("- Environment-wide first-pilot proof rollup (`collect-first-pilot-proof.ps1`) may include gates not represented in this run-only folder.");
        sb.AppendLine("- Estimated LLM/Azure costs are model-derived — not invoice truth.");
        sb.AppendLine();

        return sb.ToString();
    }

}
