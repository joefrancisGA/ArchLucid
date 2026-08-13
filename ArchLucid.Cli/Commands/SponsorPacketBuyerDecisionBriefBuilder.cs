using System.Globalization;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Produces <c>buyer-decision-brief.md</c> from data already present in the sponsor packet.
///     No live API calls; all inputs are optional — missing artifacts produce explicit caveats rather than silent omissions.
/// </summary>
public static class SponsorPacketBuyerDecisionBriefBuilder
{
    private static readonly JsonSerializerOptions JsonRead = new() { PropertyNameCaseInsensitive = true };

    /// <summary>Builds the brief from parsed file content supplied by the caller (pure — fully testable).</summary>
    public static string Build(BriefInputs inputs)
    {
        ArgumentNullException.ThrowIfNull(inputs);
        ArgumentException.ThrowIfNullOrWhiteSpace(inputs.RunId);

        PackManifestSummary manifest = ParseManifest(inputs.PackManifestJson);
        SponsorReport sponsor = ParseSponsorReport(inputs.SponsorReportJson);
        LimitationsSummary limitations = ParseLimitations(inputs.LimitationsMd);
        string? valueParagraph = ExtractFirstValueParagraph(inputs.FirstValueReportMd);
        string? executionProvenance = ExtractExecutionProvenanceLine(inputs.FirstValueReportMd);
        string disposition = DeriveDisposition(manifest, limitations);

        return RenderBrief(inputs.RunId, disposition, manifest, sponsor, limitations, valueParagraph, executionProvenance);
    }

    /// <summary>Convenience overload that reads files from <paramref name="packetDirectory"/>.</summary>
    public static string BuildFromDirectory(string packetDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(packetDirectory);

        string? manifestJson = TryReadFile(Path.Combine(packetDirectory, SponsorPacketArtifactCatalog.PackManifestFileName));
        string? SponsorReportJson = TryReadFile(Path.Combine(packetDirectory, SponsorPacketArtifactCatalog.SponsorReportFileName));
        string? limitationsMd = TryReadFile(Path.Combine(packetDirectory, "limitations.md"));
        string? firstValueReportMd = TryReadFile(Path.Combine(packetDirectory, SponsorPacketArtifactCatalog.FirstValueReportFileName));
        string runId = ExtractRunIdFromManifest(manifestJson) ?? Path.GetFileName(packetDirectory.TrimEnd(Path.DirectorySeparatorChar));

        return Build(new BriefInputs(runId, manifestJson, SponsorReportJson, limitationsMd, firstValueReportMd));
    }

    private static PackManifestSummary ParseManifest(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new PackManifestSummary(null, false);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            bool demo = root.TryGetProperty("demoDataWarning", out JsonElement demoEl) && demoEl.ValueKind == JsonValueKind.True;
            string? generatedUtc = root.TryGetProperty("generatedUtc", out JsonElement genEl) ? genEl.GetString() : null;

            return new PackManifestSummary(generatedUtc, demo);
        }
        catch (JsonException)
        {
            return new PackManifestSummary(null, false);
        }
    }

    private static SponsorReport ParseSponsorReport(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new SponsorReport(null, null, null, null);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            decimal? savings = root.TryGetProperty("totalEstimatedUsdSavings", out JsonElement savEl)
                && savEl.TryGetDecimal(out decimal d) ? d : null;
            string? scopeDescription = root.TryGetProperty("headlineSavingsScopeDescription", out JsonElement scopeEl) ? scopeEl.GetString() : null;
            string? systemRowScopeDescription = root.TryGetProperty("systemRowSavingsScopeDescription", out JsonElement systemScopeEl)
                ? systemScopeEl.GetString()
                : null;
            int? systemCount = root.TryGetProperty("systemCount", out JsonElement sysEl)
                && sysEl.TryGetInt32(out int sc) ? sc : null;

            return new SponsorReport(savings, scopeDescription, systemRowScopeDescription, systemCount);
        }
        catch (JsonException)
        {
            return new SponsorReport(null, null, null, null);
        }
    }

    private static LimitationsSummary ParseLimitations(string? markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
            return new LimitationsSummary([], []);

        List<string> holdReasons = [];
        List<string> warnReasons = [];

        foreach (string line in markdown.Split('\n'))
        {
            string trimmed = line.Trim();

            if (string.IsNullOrWhiteSpace(trimmed))
                continue;

            if (trimmed.StartsWith("- ", StringComparison.Ordinal))
            {
                string content = trimmed[2..].Trim();

                if (markdown.Contains("Hold", StringComparison.OrdinalIgnoreCase)
                    && IsUnderSection(markdown, trimmed, "Hold"))
                {
                    holdReasons.Add(content);
                }
                else if (IsUnderSection(markdown, trimmed, "Warn") || IsUnderSection(markdown, trimmed, "Warning"))
                {
                    warnReasons.Add(content);
                }
            }
        }

        if (holdReasons.Count == 0 && warnReasons.Count == 0)
        {
            holdReasons.AddRange(ExtractBulletItems(markdown, "Hold"));
            warnReasons.AddRange(ExtractBulletItems(markdown, "Warn"));
        }

        return new LimitationsSummary(holdReasons, warnReasons);
    }

    private static List<string> ExtractBulletItems(string markdown, string sectionKeyword)
    {
        List<string> items = [];
        bool inSection = false;

        foreach (string line in markdown.Split('\n'))
        {
            string trimmed = line.Trim();

            if (trimmed.StartsWith('#') && trimmed.Contains(sectionKeyword, StringComparison.OrdinalIgnoreCase))
            {
                inSection = true;
                continue;
            }

            if (inSection && trimmed.StartsWith('#'))
            {
                inSection = false;
                continue;
            }

            if (inSection && trimmed.StartsWith("- ", StringComparison.Ordinal))
                items.Add(trimmed[2..].Trim());
        }

        return items;
    }

    private static bool IsUnderSection(string markdown, string targetLine, string sectionKeyword)
    {
        bool inSection = false;

        foreach (string line in markdown.Split('\n'))
        {
            string trimmed = line.Trim();

            if (trimmed.StartsWith('#') && trimmed.Contains(sectionKeyword, StringComparison.OrdinalIgnoreCase))
            {
                inSection = true;
                continue;
            }

            if (inSection && trimmed.StartsWith('#'))
            {
                inSection = false;
                continue;
            }

            if (inSection && string.Equals(trimmed, targetLine, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static string? ExtractFirstValueParagraph(string? markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
            return null;

        StringBuilder paragraph = new();

        foreach (string line in markdown.Split('\n'))
        {
            string trimmed = line.Trim();

            if (string.IsNullOrWhiteSpace(trimmed))
            {
                if (paragraph.Length > 0)
                    return paragraph.ToString().Trim();

                continue;
            }

            if (trimmed.StartsWith('#') || trimmed.StartsWith('|') || trimmed.StartsWith('>'))
                continue;

            paragraph.Append(trimmed);
            paragraph.Append(' ');
        }

        return paragraph.Length > 0 ? paragraph.ToString().Trim() : null;
    }

    private static string DeriveDisposition(PackManifestSummary manifest, LimitationsSummary limitations)
    {
        if (limitations.HoldReasons.Count > 0)
            return "HOLD";

        if (manifest.DemoDataWarning || limitations.WarnReasons.Count > 0)
            return "WARN";

        return "PASS";
    }

    private static string? ExtractExecutionProvenanceLine(string? firstValueReportMd)
    {
        if (string.IsNullOrWhiteSpace(firstValueReportMd))
            return null;

        foreach (string rawLine in firstValueReportMd.Split('\n'))
        {
            string line = rawLine.Trim();

            if (!line.StartsWith("| Mode |", StringComparison.Ordinal))
                continue;

            string[] cells = line.Split('|', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

            if (cells.Length >= 2)
                return cells[1];
        }

        return null;
    }

    private static string RenderBrief(
        string runId,
        string disposition,
        PackManifestSummary manifest,
        SponsorReport sponsor,
        LimitationsSummary limitations,
        string? valueParagraph,
        string? executionProvenance)
    {
        StringBuilder sb = new();
        string generatedUtc = manifest.GeneratedUtc ?? DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture);

        sb.AppendLine("> Buyer-safe. No internal diagnostics, secrets, or raw prompts. Review `limitations.md` before external circulation.");
        sb.AppendLine();
        sb.AppendLine("# Buyer decision brief");
        sb.AppendLine();
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Run:** `{runId.Trim()}`  ");
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Generated (UTC):** {generatedUtc}  ");
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Sponsor-send disposition:** **{disposition}**");

        if (!string.IsNullOrWhiteSpace(executionProvenance))
        {
            sb.AppendLine();
            sb.AppendLine(CultureInfo.InvariantCulture, $"**Evidence basis (execution mode):** **{executionProvenance}**");
        }

        sb.AppendLine();
        sb.AppendLine("## Outcome");
        sb.AppendLine();
        AppendOutcomeSection(sb, disposition, sponsor, manifest);
        sb.AppendLine();
        sb.AppendLine("## Quantified value");
        sb.AppendLine();
        AppendValueSection(sb, sponsor, valueParagraph);
        sb.AppendLine();
        sb.AppendLine("## Top caveats");
        sb.AppendLine();
        AppendCaveatsSection(sb, limitations, manifest);
        sb.AppendLine();
        sb.AppendLine("## Evidence links");
        sb.AppendLine();
        AppendEvidenceLinks(sb);
        sb.AppendLine();
        sb.AppendLine("## Recommended next step");
        sb.AppendLine();
        AppendNextStep(sb, disposition);

        return sb.ToString();
    }

    private static void AppendOutcomeSection(StringBuilder sb, string disposition, SponsorReport sponsor, PackManifestSummary manifest)
    {
        string headline = disposition switch
        {
            "PASS" => "Architecture review completed. Findings are committed and sponsor-send ready.",
            "WARN" => "Architecture review completed with caveats. Review `limitations.md` before external circulation.",
            "HOLD" => "Architecture review completed. Sponsor send is on hold pending resolution of `limitations.md` items.",
            _ => "Architecture review completed.",
        };

        sb.AppendLine(headline);

        if (sponsor.SystemCount.HasValue)
        {
            sb.AppendLine();
            sb.AppendLine(CultureInfo.InvariantCulture,
                $"{sponsor.SystemCount.Value} system{(sponsor.SystemCount.Value == 1 ? string.Empty : "s")} evaluated in this committed run.");
        }

        if (manifest.DemoDataWarning)
        {
            sb.AppendLine();
            sb.AppendLine("**Demo data:** This packet was generated from a demo or synthetic tenant. Do not present as evidence of a live architecture review.");
        }
    }

    private static void AppendValueSection(StringBuilder sb, SponsorReport sponsor, string? valueParagraph)
    {
        if (sponsor.TotalEstimatedUsdSavings.HasValue)
        {
            string formatted = sponsor.TotalEstimatedUsdSavings.Value.ToString("C0", CultureInfo.InvariantCulture);
            string scope = string.IsNullOrWhiteSpace(sponsor.HeadlineSavingsScopeDescription)
                ? RoiSponsorFacingScopeDescriptions.HeadlineDispositionAware
                : sponsor.HeadlineSavingsScopeDescription;
            string systemRowScope = string.IsNullOrWhiteSpace(sponsor.SystemRowSavingsScopeDescription)
                ? RoiSponsorFacingScopeDescriptions.SystemRowSnapshotPotential
                : sponsor.SystemRowSavingsScopeDescription;

            sb.AppendLine(CultureInfo.InvariantCulture,
                $"**Estimated savings:** {formatted} ({scope})");
            sb.AppendLine();
            sb.AppendLine(CultureInfo.InvariantCulture, $"**Per-system scope:** {systemRowScope}");
            sb.AppendLine();
            sb.AppendLine(RoiSponsorFacingScopeDescriptions.NonAdditivityCaveat);
            sb.AppendLine();
            sb.AppendLine("This is a projected estimate based on architecture findings. It is not a guarantee and depends on the buyer's implementation choices and environment.");
        }
        else
        {
            sb.AppendLine("Savings estimate not available in this packet. See `sponsor-report.json` when present.");
        }

        if (!string.IsNullOrWhiteSpace(valueParagraph))
        {
            sb.AppendLine();

            // Truncate to ~600 chars to stay within one page
            string truncated = valueParagraph.Length > 600
                ? string.Concat(valueParagraph.AsSpan(0, 597), "...")
                : valueParagraph;

            sb.AppendLine(truncated);
        }
    }

    private static void AppendCaveatsSection(StringBuilder sb, LimitationsSummary limitations, PackManifestSummary manifest)
    {
        bool anyCaveats = false;

        if (manifest.DemoDataWarning)
        {
            sb.AppendLine("- **Demo data:** findings reflect synthetic or seeded data, not a live production corpus.");
            anyCaveats = true;
        }

        foreach (string reason in limitations.HoldReasons.Take(5))
        {
            sb.AppendLine(CultureInfo.InvariantCulture, $"- **HOLD:** {reason}");
            anyCaveats = true;
        }

        foreach (string reason in limitations.WarnReasons.Take(3))
        {
            sb.AppendLine(CultureInfo.InvariantCulture, $"- **WARN:** {reason}");
            anyCaveats = true;
        }

        if (!anyCaveats)
            sb.AppendLine("No hold or warn caveats at time of packet generation. See `limitations.md` for the full list.");

        sb.AppendLine();
        sb.AppendLine("This brief does not claim live Azure OpenAI validation, SOC certification, marketplace listing, or customer references unless explicitly stated in source artifacts.");
    }

    private static void AppendEvidenceLinks(StringBuilder sb)
    {
        sb.AppendLine("| Artifact | Purpose |");
        sb.AppendLine("| --- | --- |");

        foreach (SponsorPacketArtifactEntry entry in SponsorPacketArtifactCatalog.IndexEntries)
            sb.AppendLine(CultureInfo.InvariantCulture, $"| `{entry.FileName}` | {entry.Purpose.Replace("|", "/", StringComparison.Ordinal)} |");
    }

    private static void AppendNextStep(StringBuilder sb, string disposition)
    {
        string step = disposition switch
        {
            "PASS" => "Share this packet with the sponsor reviewer. Confirm the recipient has signed an NDA or equivalent before attaching `provenance-references.json`.",
            "WARN" => "Review `limitations.md` caveats with the account team. Proceed with sponsor circulation if caveats are acknowledged in writing.",
            "HOLD" => "Do not circulate externally. Resolve hold items listed in `limitations.md`, regenerate the packet, and confirm disposition is PASS or WARN before sharing.",
            _ => "Consult `limitations.md` to determine whether this packet is ready for external circulation.",
        };

        sb.AppendLine(step);
    }

    private static string? TryReadFile(string path)
    {
        if (!File.Exists(path))
            return null;

        return File.ReadAllText(path, Encoding.UTF8);
    }

    private static string? ExtractRunIdFromManifest(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);

            if (doc.RootElement.TryGetProperty("runId", out JsonElement runEl))
                return runEl.GetString();
        }
        catch (JsonException)
        {
        }

        return null;
    }

    /// <summary>Pure inputs for <see cref="Build"/>; all file content strings are optional.</summary>
    public sealed record BriefInputs(
        string RunId,
        string? PackManifestJson,
        string? SponsorReportJson,
        string? LimitationsMd,
        string? FirstValueReportMd);

    private sealed record PackManifestSummary(string? GeneratedUtc, bool DemoDataWarning);

    private sealed record SponsorReport(
        decimal? TotalEstimatedUsdSavings,
        string? HeadlineSavingsScopeDescription,
        string? SystemRowSavingsScopeDescription,
        int? SystemCount);

    private sealed record LimitationsSummary(List<string> HoldReasons, List<string> WarnReasons);
}
