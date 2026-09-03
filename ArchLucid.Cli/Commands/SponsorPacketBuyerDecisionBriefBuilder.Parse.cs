using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

public static partial class SponsorPacketBuyerDecisionBriefBuilder
{
    private static SponsorPacketBuyerDecisionBriefSections.PackManifestSummary ParseManifest(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new SponsorPacketBuyerDecisionBriefSections.PackManifestSummary(null, false);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            bool demo = root.TryGetProperty("demoDataWarning", out JsonElement demoEl) && demoEl.ValueKind == JsonValueKind.True;
            string? generatedUtc = root.TryGetProperty("generatedUtc", out JsonElement genEl) ? genEl.GetString() : null;

            return new SponsorPacketBuyerDecisionBriefSections.PackManifestSummary(generatedUtc, demo);
        }
        catch (JsonException)
        {
            return new SponsorPacketBuyerDecisionBriefSections.PackManifestSummary(null, false);
        }
    }

    private static SponsorPacketBuyerDecisionBriefSections.SponsorReport ParseSponsorReport(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new SponsorPacketBuyerDecisionBriefSections.SponsorReport(null, null, null, null);

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

            return new SponsorPacketBuyerDecisionBriefSections.SponsorReport(savings, scopeDescription, systemRowScopeDescription, systemCount);
        }
        catch (JsonException)
        {
            return new SponsorPacketBuyerDecisionBriefSections.SponsorReport(null, null, null, null);
        }
    }

    private static SponsorPacketBuyerDecisionBriefSections.LimitationsSummary ParseLimitations(string? markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
            return new SponsorPacketBuyerDecisionBriefSections.LimitationsSummary([], []);

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

        return new SponsorPacketBuyerDecisionBriefSections.LimitationsSummary(holdReasons, warnReasons);
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
}
