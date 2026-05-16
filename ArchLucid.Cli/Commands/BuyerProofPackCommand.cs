using System.Globalization;
using System.IO.Compression;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid buyer-proof-pack</c> — email-sized ZIP after a committed pilot run (see assessment recorded decisions).
/// </summary>
internal static class BuyerProofPackCommand
{
    private const string PackFormatVersion = "1.0";

    private static readonly UTF8Encoding Utf8NoBom = new(false);

    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        string? runId = null;
        string? outZip = null;
        string? repoRootOverride = null;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--out", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    await Console.Error.WriteLineAsync("Missing value for --out.");

                    return CliExitCode.UsageError;
                }

                outZip = args[++i];

                continue;
            }

            if (string.Equals(token, "--repo-root", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    await Console.Error.WriteLineAsync("Missing value for --repo-root.");

                    return CliExitCode.UsageError;
                }

                repoRootOverride = args[++i];

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

        if (string.IsNullOrWhiteSpace(runId) || string.IsNullOrWhiteSpace(outZip))
        {
            await Console.Error.WriteLineAsync(
                "Usage: archlucid buyer-proof-pack <runId> --out <path.zip> [--repo-root <dir>]");

            return CliExitCode.UsageError;
        }

        string? repoRoot = ResolveRepoRoot(repoRootOverride);

        if (repoRoot is null || !Directory.Exists(repoRoot))
        {
            await Console.Error.WriteLineAsync(
                "Could not locate repository root (docs/go-to-market/MARKETPLACE_PUBLICATION.md). Run from the repo tree or pass --repo-root.");

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
        http.Timeout = TimeSpan.FromMinutes(2);
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

        using HttpResponseMessage mdResponse =
            await http.GetAsync($"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report", cancellationToken);

        if (!mdResponse.IsSuccessStatusCode)
        {
            await Console.Error.WriteLineAsync($"Error fetching first-value Markdown: {(int)mdResponse.StatusCode}");

            return CliExitCode.OperationFailed;
        }

        string markdown = await mdResponse.Content.ReadAsStringAsync(cancellationToken);

        using HttpRequestMessage pdfReq = new(HttpMethod.Post,
            $"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report.pdf");

        pdfReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/pdf"));

        using HttpResponseMessage pdfResponse = await http.SendAsync(pdfReq, cancellationToken);

        if (!pdfResponse.IsSuccessStatusCode)
        {
            await Console.Error.WriteLineAsync($"Error fetching first-value PDF: {(int)pdfResponse.StatusCode}");

            return CliExitCode.OperationFailed;
        }

        byte[] pdfBytes = await pdfResponse.Content.ReadAsByteArrayAsync(cancellationToken);

        string sponsorBriefSource = Path.Combine(repoRoot, "docs", "go-to-market", "EXECUTIVE_SPONSOR_BRIEF.md");

        if (!File.Exists(sponsorBriefSource))
        {
            await Console.Error.WriteLineAsync($"Missing sponsor brief source: {sponsorBriefSource}");

            return CliExitCode.OperationFailed;
        }

        string sponsorBriefText = await File.ReadAllTextAsync(sponsorBriefSource, cancellationToken);

        string staging = Path.Combine(Path.GetTempPath(), "ArchLucidBuyerProofPack." + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(staging);

            await File.WriteAllTextAsync(Path.Combine(staging, "first-value-report.md"), markdown, Utf8NoBom, cancellationToken);

            await File.WriteAllBytesAsync(Path.Combine(staging, "first-value-report.pdf"), pdfBytes, cancellationToken);

            await File.WriteAllTextAsync(
                Path.Combine(staging, "pilot-run-deltas.json"),
                PrettyPrintJson(deltasJson),
                Utf8NoBom,
                cancellationToken);

            await File.WriteAllTextAsync(
                Path.Combine(staging, "artifact-and-proof-summary.md"),
                BuildArtifactSummaryMarkdown(deltasJson),
                Utf8NoBom,
                cancellationToken);

            await File.WriteAllTextAsync(Path.Combine(staging, "executive-sponsor-brief.md"), sponsorBriefText, Utf8NoBom, cancellationToken);

            await File.WriteAllTextAsync(
                Path.Combine(staging, "trust-posture-pointer.md"),
                BuildTrustPointerMarkdown(),
                Utf8NoBom,
                cancellationToken);

            await File.WriteAllTextAsync(
                Path.Combine(staging, "pilot-scorecard-blank.md"),
                PilotScorecardBlankMarkdown,
                Utf8NoBom,
                cancellationToken);

            PackFileEntry[] entries =
            [
                new("first-value-report.md", await File.ReadAllBytesAsync(Path.Combine(staging, "first-value-report.md"), cancellationToken)),
                new("first-value-report.pdf", pdfBytes),
                new("pilot-run-deltas.json", await File.ReadAllBytesAsync(Path.Combine(staging, "pilot-run-deltas.json"), cancellationToken)),
                new("artifact-and-proof-summary.md",
                    await File.ReadAllBytesAsync(Path.Combine(staging, "artifact-and-proof-summary.md"), cancellationToken)),
                new("executive-sponsor-brief.md",
                    await File.ReadAllBytesAsync(Path.Combine(staging, "executive-sponsor-brief.md"), cancellationToken)),
                new("trust-posture-pointer.md",
                    await File.ReadAllBytesAsync(Path.Combine(staging, "trust-posture-pointer.md"), cancellationToken)),
                new("pilot-scorecard-blank.md",
                    await File.ReadAllBytesAsync(Path.Combine(staging, "pilot-scorecard-blank.md"), cancellationToken)),
            ];

            Array.Sort(entries, static (a, b) => string.CompareOrdinal(a.RelativePath, b.RelativePath));

            string manifestJson = BuildPackManifestJson(runId, demoWarning, entries);
            byte[] manifestBytes = Utf8NoBom.GetBytes(manifestJson);
            await File.WriteAllBytesAsync(Path.Combine(staging, "pack-manifest.json"), manifestBytes, cancellationToken);

            string? outDir = Path.GetDirectoryName(Path.GetFullPath(outZip));

            if (!string.IsNullOrEmpty(outDir))
                Directory.CreateDirectory(outDir);

            if (File.Exists(outZip))
                File.Delete(outZip);

            await using (FileStream zipFs = new(outZip, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            await using (ZipArchive zip = new(zipFs, ZipArchiveMode.Create))
            {
                foreach (PackFileEntry entry in entries)
                {
                    ZipArchiveEntry ze = zip.CreateEntry(entry.RelativePath, CompressionLevel.Optimal);

                    await using Stream zs = await ze.OpenAsync(cancellationToken);
                    await zs.WriteAsync(entry.Content, cancellationToken);
                }

                ZipArchiveEntry m = zip.CreateEntry("pack-manifest.json", CompressionLevel.Optimal);

                await using Stream ms = await m.OpenAsync(cancellationToken);
                await ms.WriteAsync(manifestBytes, cancellationToken);
            }

            Console.WriteLine($"Wrote buyer proof pack: {outZip}");

            return CliExitCode.Success;
        }
        finally
        {
            if (Directory.Exists(staging))
                Directory.Delete(staging, true);
        }
    }

    private static string? ResolveRepoRoot(string? overridePath)
    {
        if (string.IsNullOrWhiteSpace(overridePath))
            return CliRepositoryRootResolver.TryResolveRepositoryRoot();

        string full = Path.GetFullPath(overridePath.Trim());

        return Directory.Exists(full) ? full : CliRepositoryRootResolver.TryResolveRepositoryRoot();
    }

    private static string PrettyPrintJson(string raw)
    {
        using JsonDocument doc = JsonDocument.Parse(raw);

        return JsonSerializer.Serialize(doc.RootElement, new JsonSerializerOptions { WriteIndented = true });
    }

    private static string BuildArtifactSummaryMarkdown(string deltasJson)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;
        StringBuilder sb = new();

        sb.AppendLine("# Artifact and proof summary (compact)");
        sb.AppendLine();
        sb.AppendLine("Generated from `GET /v1/pilots/runs/{runId}/pilot-run-deltas` — not a substitute for the full first-value report.");
        sb.AppendLine();

        if (root.TryGetProperty("proofPackageCompleteness", out JsonElement p))
        {
            sb.AppendLine("## Proof-package completeness (API checklist)");
            sb.AppendLine();
            sb.AppendLine("| Field | Value |");
            sb.AppendLine("| --- | --- |");

            foreach (JsonProperty prop in p.EnumerateObject().OrderBy(static x => x.Name, StringComparer.Ordinal))
            {
                sb.Append("| `");
                sb.Append(prop.Name);
                sb.Append("` | ");
                sb.Append(SummarizeJsonElement(prop.Value));
                sb.AppendLine(" |");
            }

            sb.AppendLine();
        }

        sb.AppendLine("## Findings by severity (counts)");
        sb.AppendLine();

        if (root.TryGetProperty("findingsBySeverity", out JsonElement sev) && sev.ValueKind == JsonValueKind.Array)
        {
            sb.AppendLine("| Severity | Count |");
            sb.AppendLine("| --- | ---: |");

            foreach (JsonElement row in sev.EnumerateArray())
            {
                string s = row.TryGetProperty("severity", out JsonElement se) ? se.GetString() ?? "" : "";
                string c = row.TryGetProperty("count", out JsonElement cnt) ? cnt.GetInt32().ToString() : "";

                sb.AppendLine(CultureInfo.InvariantCulture, $"| {s} | {c} |");
            }
        }
        else
        {
            sb.AppendLine("_(No severity buckets in response.)_");
        }

        sb.AppendLine();

        if (!root.TryGetProperty("topFindingId", out JsonElement tf) || tf.ValueKind != JsonValueKind.String)
            return sb.ToString();
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Top finding id (evidence excerpt):** `{tf.GetString()}`");
        sb.AppendLine();

        return sb.ToString();
    }

    private static string SummarizeJsonElement(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.String => "`" + el.GetString() + "`",
        JsonValueKind.Number => el.GetRawText(),
        JsonValueKind.True => "`true`",
        JsonValueKind.False => "`false`",
        JsonValueKind.Null => "`null`",
        _ => "`(complex)`",
    };

    private static string BuildTrustPointerMarkdown() =>
        """
        # Trust posture (pointer)

        This pack includes a **one-page narrative pointer**, not the full procurement bundle.

        - Canonical buyer trust narrative: repository `docs/go-to-market/TRUST_CENTER.md` (and hosted `/trust` when deployed).
        - Security and tenant isolation depth: `docs/security/` and `docs/library/V1_SCOPE.md`.

        Review the first-value report **Sponsor send readiness (buyer-safe gate)** and demo banners before external circulation.

        """;

    private static string BuildPackManifestJson(string runId, bool demoWarning, PackFileEntry[] sortedEntries)
    {
        DateTimeOffset utc = TimeProvider.System.GetUtcNow();
        Dictionary<string, object> root = new(StringComparer.Ordinal)
        {
            ["formatVersion"] = PackFormatVersion,
            ["generatedUtc"] = utc.ToString("O"),
            ["runId"] = runId,
            ["demoDataWarning"] = demoWarning,
            ["files"] = sortedEntries.Select(e => new Dictionary<string, object>(StringComparer.Ordinal)
            {
                ["path"] = e.RelativePath,
                ["sha256"] = Sha256Hex(e.Content),
                ["sizeBytes"] = e.Content.Length,
            })
                .ToList(),
        };

        return JsonSerializer.Serialize(root, new JsonSerializerOptions { WriteIndented = true });
    }

    private static string Sha256Hex(byte[] content)
    {
        byte[] hash = SHA256.HashData(content);

        StringBuilder sb = new(hash.Length * 2);

        foreach (byte b in hash)
            sb.Append(b.ToString("x2"));

        return sb.ToString();
    }

    private sealed record PackFileEntry(string RelativePath, byte[] Content);

    private const string PilotScorecardBlankMarkdown = """
        # Pilot scorecard (blank template)

        Excerpted from repository `docs/library/PILOT_ROI_MODEL.md` §6. Use a 1–5 score per row.

        | Area | Question | Score 1–5 |
        |------|----------|-----------|
        | **Speed** | Did we get to a committed manifest faster or more predictably? | |
        | **Artifact readiness** | Did we get to a reviewable package with less manual assembly? | |
        | **Traceability** | Were decisions and evidence easier to explain? | |
        | **Change clarity** | Was it easier to understand what changed between runs? | |
        | **Governance readiness** | Did the pilot improve review or approval readiness? | |
        | **Operator usability** | Could operators complete the Core Pilot path without excessive friction? | |
        | **Stakeholder confidence** | Did reviewers trust the outputs enough to use them seriously? | |
        | **Repeatability** | Would we use this again for a similar architecture request? | |

        ### Reading the scorecard

        - **32–40** = strong pilot result
        - **24–31** = promising, but more hardening or scope narrowing may be needed
        - **Below 24** = pilot likely proved interest but not enough operational or business value yet

        """;
}
