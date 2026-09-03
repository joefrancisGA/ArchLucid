using System.Globalization;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>ZIP assembly, pack manifest ledger, and staging writers for <see cref="BuyerProofPackCommand" />.</summary>
internal static class BuyerProofPackZipWriter
{
    private const string PackFormatVersion = "1.0";

    internal static async Task<int> WriteAsync(
        BuyerProofPackCommandFetch.Success fetch,
        string outZip,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(fetch);
        ArgumentException.ThrowIfNullOrWhiteSpace(outZip);

        BuyerProofArtifacts artifacts = fetch.Artifacts;
        string deltasJson = artifacts.DeltasJson;
        string markdown = artifacts.FirstValueMarkdown;
        byte[] pdfBytes = artifacts.FirstValuePdf ?? [];
        bool demoWarning = artifacts.DemoWarning;

        string staging = Path.Combine(Path.GetTempPath(), "ArchLucidBuyerProofPack." + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(staging);

            await BuyerPacketFolderWriter.WriteTextAsync(staging, "first-value-report.md", markdown, cancellationToken);

            await File.WriteAllBytesAsync(Path.Combine(staging, "first-value-report.pdf"), pdfBytes, cancellationToken);

            await BuyerPacketFolderWriter.WriteJsonRawAsync(staging, "pilot-run-deltas.json", deltasJson, cancellationToken);

            await BuyerPacketFolderWriter.WriteTextAsync(
                staging,
                "artifact-and-proof-summary.md",
                BuildArtifactSummaryMarkdown(deltasJson),
                cancellationToken);

            await BuyerPacketFolderWriter.WriteTextAsync(staging, "sponsor-sponsor-brief.md", fetch.SponsorBriefText, cancellationToken);

            await BuyerPacketFolderWriter.WriteTextAsync(
                staging,
                "trust-posture-pointer.md",
                BuildTrustPointerMarkdown(),
                cancellationToken);

            await BuyerPacketFolderWriter.WriteTextAsync(
                staging,
                "pilot-scorecard-blank.md",
                PilotScorecardBlankMarkdown,
                cancellationToken);

            PackFileEntry[] entries =
            [
                new("first-value-report.md", await File.ReadAllBytesAsync(Path.Combine(staging, "first-value-report.md"), cancellationToken)),
                new("first-value-report.pdf", pdfBytes),
                new("pilot-run-deltas.json", await File.ReadAllBytesAsync(Path.Combine(staging, "pilot-run-deltas.json"), cancellationToken)),
                new("artifact-and-proof-summary.md",
                    await File.ReadAllBytesAsync(Path.Combine(staging, "artifact-and-proof-summary.md"), cancellationToken)),
                new("sponsor-sponsor-brief.md",
                    await File.ReadAllBytesAsync(Path.Combine(staging, "sponsor-sponsor-brief.md"), cancellationToken)),
                new("trust-posture-pointer.md",
                    await File.ReadAllBytesAsync(Path.Combine(staging, "trust-posture-pointer.md"), cancellationToken)),
                new("pilot-scorecard-blank.md",
                    await File.ReadAllBytesAsync(Path.Combine(staging, "pilot-scorecard-blank.md"), cancellationToken)),
            ];

            Array.Sort(entries, static (a, b) => string.CompareOrdinal(a.RelativePath, b.RelativePath));

            string manifestJson = BuildPackManifestJson(fetch.RunId, demoWarning, entries);
            byte[] manifestBytes = BuyerPacketFolderWriter.Utf8NoBom.GetBytes(manifestJson);
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

        return JsonSerializer.Serialize(root, BuyerPacketFolderWriter.JsonWriteIndented);
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
