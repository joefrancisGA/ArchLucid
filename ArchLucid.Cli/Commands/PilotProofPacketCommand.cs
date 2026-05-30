using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid pilot proof-packet</c> — buyer-safe folder with assessment filenames after a committed run.
/// </summary>
internal static class PilotProofPacketCommand
{
    private static readonly UTF8Encoding Utf8NoBom = new(false);

    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };

    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        string? runId = null;
        string? outputDirectory = null;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

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
        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        using HttpClient http = new();
        http.Timeout = TimeSpan.FromMinutes(3);
        http.BaseAddress = new Uri(normalized + "/");

        if (!string.IsNullOrWhiteSpace(apiKey))
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);

        string deltasPath = $"v1/pilots/runs/{Uri.EscapeDataString(runId)}/pilot-run-deltas";

        using HttpResponseMessage deltasResponse = await http.GetAsync(deltasPath, cancellationToken);

        if (deltasResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            await Console.Error.WriteLineAsync($"Run '{runId}' was not found (or is out of scope).");

            return CliExitCode.UsageError;
        }

        if (!deltasResponse.IsSuccessStatusCode)
        {
            string body = await deltasResponse.Content.ReadAsStringAsync(cancellationToken);
            await Console.Error.WriteLineAsync($"Error fetching pilot-run-deltas: {(int)deltasResponse.StatusCode}: {body}");

            return CliExitCode.OperationFailed;
        }

        string deltasJson = await deltasResponse.Content.ReadAsStringAsync(cancellationToken);

        if (!BuyerProofPackCommitGuard.TryValidate(deltasJson, out bool demoWarning, out string? gateError))
        {
            await Console.Error.WriteLineAsync(gateError);

            return CliExitCode.UsageError;
        }

        string dir = outputDirectory
                     ?? Path.Combine(Directory.GetCurrentDirectory(), "proof-packet", runId);
        Directory.CreateDirectory(dir);

        await File.WriteAllTextAsync(Path.Combine(dir, "run-evidence.json"), PrettyPrintJson(deltasJson), Utf8NoBom, cancellationToken);

        await PilotProofPacketRoiArtifacts.WriteAsync(dir, deltasJson, cancellationToken);

        bool pilotStrictSatisfied = PilotProofPacketRoiArtifacts.TryResolvePilotStrictSatisfied(deltasJson);

        if (!pilotStrictSatisfied)
        {
            await Console.Error.WriteLineAsync(
                "WARN: PilotStrict evidence is not satisfied — sponsor handoff is not recommended (see limitations.md).");
        }

        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using HttpResponseMessage aggregateResponse =
            await http.GetAsync($"v1/explain/runs/{Uri.EscapeDataString(runId)}/aggregate", cancellationToken);

        string? aggregateJson = aggregateResponse.IsSuccessStatusCode
            ? await aggregateResponse.Content.ReadAsStringAsync(cancellationToken)
            : null;

        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/markdown"));

        using HttpResponseMessage mdResponse =
            await http.GetAsync($"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report", cancellationToken);

        string? firstValueMarkdown = mdResponse.IsSuccessStatusCode
            ? await mdResponse.Content.ReadAsStringAsync(cancellationToken)
            : null;

        if (firstValueMarkdown is not null)
        {
            string summaryBody = PrependProofSummaryRoiLink(firstValueMarkdown, dir);

            await File.WriteAllTextAsync(Path.Combine(dir, "proof-summary.md"), summaryBody, Utf8NoBom, cancellationToken);
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
            JsonWrite);
        await File.WriteAllTextAsync(Path.Combine(dir, "audit-sample.json"), auditSampleJson, Utf8NoBom, cancellationToken);

        string artifactManifestJson = JsonSerializer.Serialize(
            new
            {
                schema = "archlucid.proof-packet.artifact-manifest.v1",
                runId,
                capturedUtc = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
                artifactIds,
            },
            JsonWrite);
        await File.WriteAllTextAsync(Path.Combine(dir, "artifact-manifest.json"), artifactManifestJson, Utf8NoBom, cancellationToken);

        string environmentJson = BuildEnvironmentJson(config, normalized, deltasJson, demoWarning, pilotStrictSatisfied);
        await File.WriteAllTextAsync(Path.Combine(dir, "environment.json"), environmentJson, Utf8NoBom, cancellationToken);

        string limitations = BuildLimitationsMarkdown(demoWarning, deltasJson, aggregateJson);
        await File.WriteAllTextAsync(Path.Combine(dir, "limitations.md"), limitations, Utf8NoBom, cancellationToken);

        string commercialReadiness = PilotProofPacketCommercialReadinessBuilder.BuildJson(
            runId,
            deltasJson,
            demoWarning,
            pilotStrictSatisfied,
            aggregateJson);
        await File.WriteAllTextAsync(
            Path.Combine(dir, "quote-to-proof-readiness.json"),
            commercialReadiness,
            Utf8NoBom,
            cancellationToken);

        string governanceSummary = PilotProofPacketGovernanceArtifacts.BuildGovernanceOutcomeSummaryJson(
            runId,
            deltasJson,
            pilotStrictSatisfied);
        await File.WriteAllTextAsync(
            Path.Combine(dir, "governance-outcome-summary.json"),
            governanceSummary,
            Utf8NoBom,
            cancellationToken);

        string auditSummary = PilotProofPacketGovernanceArtifacts.BuildAuditEvidenceSummaryJson(
            runId,
            auditIds,
            deltasJson);
        await File.WriteAllTextAsync(
            Path.Combine(dir, "audit-evidence-summary.json"),
            auditSummary,
            Utf8NoBom,
            cancellationToken);

        string auditSummaryMarkdown = PilotProofPacketGovernanceArtifacts.BuildAuditEvidenceSummaryMarkdown(
            runId,
            auditIds,
            deltasJson);
        await File.WriteAllTextAsync(
            Path.Combine(dir, "audit-evidence-summary.md"),
            auditSummaryMarkdown,
            Utf8NoBom,
            cancellationToken);

        string dataConsistencyJson = PilotProofPacketDataConsistencyArtifacts.BuildSummaryJson(runId, deltasJson);
        await File.WriteAllTextAsync(
            Path.Combine(dir, "data-consistency-summary.json"),
            dataConsistencyJson,
            Utf8NoBom,
            cancellationToken);

        string dataConsistencyMarkdown = PilotProofPacketDataConsistencyArtifacts.BuildSummaryMarkdown(runId, deltasJson);
        await File.WriteAllTextAsync(
            Path.Combine(dir, "data-consistency-summary.md"),
            dataConsistencyMarkdown,
            Utf8NoBom,
            cancellationToken);

        string scaleEnvelope = PilotProofPacketGovernanceArtifacts.BuildScaleEnvelopeEvidenceJson(
            runId,
            deltasJson,
            Support.SupportBundleRedactor.RedactHttpUrl(normalized));
        await File.WriteAllTextAsync(
            Path.Combine(dir, "scale-envelope-evidence.json"),
            scaleEnvelope,
            Utf8NoBom,
            cancellationToken);

        string redactionManifest = PilotProofPacketRedactionManifestBuilder.BuildJson(
            redactionPassApplied: true,
            outputDirectory: dir);
        await File.WriteAllTextAsync(
            Path.Combine(dir, "redaction-manifest.json"),
            redactionManifest,
            Utf8NoBom,
            cancellationToken);

        Console.WriteLine($"Wrote buyer proof packet folder: {dir}");

        return CliExitCode.Success;
    }

    private static string PrettyPrintJson(string raw)
    {
        using JsonDocument doc = JsonDocument.Parse(raw);

        return JsonSerializer.Serialize(doc.RootElement, JsonWrite);
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

        return JsonSerializer.Serialize(payload, JsonWrite);
    }

    private static string BuildLimitationsMarkdown(bool demoWarning, string deltasJson, string? aggregateJson)
    {
        StringBuilder sb = new();
        sb.AppendLine("# Limitations");
        sb.AppendLine();
        sb.AppendLine("This proof packet summarizes one committed architecture review. It is buyer-safe by design (no secrets).");
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
