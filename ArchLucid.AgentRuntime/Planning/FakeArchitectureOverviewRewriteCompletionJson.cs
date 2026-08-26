using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.AgentRuntime.Planning;

/// <summary>
///     Deterministic JSON completions for architecture overview rewrite when LLMs are offline (simulator / fake client).
/// </summary>
public static class FakeArchitectureOverviewRewriteCompletionJson
{
    /// <summary>Builds a valid overview-rewrite response for <see cref="Application.Planning.ArchitectureOverviewRewriteService" /> parsing.</summary>
    public static string Build(string userPrompt)
    {
        string systemName = ExtractLineValue(userPrompt, "System name:");
        string businessOutcome = ExtractLineValue(userPrompt, "Business outcome:");
        string currentOverview = ExtractSection(userPrompt, "Current architecture overview:");
        List<string> confirmedConstraints = ExtractBulletList(userPrompt, "Confirmed constraints:");
        List<string> confirmedAssumptions = ExtractBulletList(userPrompt, "Confirmed assumptions:");
        List<string> confirmedCapabilities = ExtractBulletList(userPrompt, "Confirmed required capabilities:");

        string overviewBody = StripSimulatorGeneratedArtifacts(currentOverview, systemName, businessOutcome);

        StringBuilder rewritten = new();

        if (systemName.Length > 0)
            rewritten.Append(systemName).Append(" — ");

        if (businessOutcome.Length > 0)
            rewritten.Append("Business outcome: ").Append(businessOutcome).Append(". ");

        if (overviewBody.Length > 0)
        {
            // Keep the full overview. Intake rejects text above DraftIntakeValidation.MaximumFreeTextIntentLength;
            // a 4,000-character clip made realistic review packets look like a successful shorter rewrite.
            rewritten.AppendLine();
            rewritten.AppendLine();
            rewritten.Append(overviewBody);
        }
        else
        {
            rewritten.Append("Architecture overview grounded from the confirmed structured brief.");
        }

        AppendGroundingSection(rewritten, "Confirmed constraints", confirmedConstraints);
        AppendGroundingSection(rewritten, "Confirmed assumptions", confirmedAssumptions);
        AppendGroundingSection(rewritten, "Confirmed required capabilities", confirmedCapabilities);

        rewritten.AppendLine();
        rewritten.AppendLine();
        rewritten.Append(
            "(Simulator mode — deterministic rewrite from the confirmed structured brief. " +
            "Connect a live LLM deployment for production-quality narrative polish.)");

        JsonObject root = new()
        {
            ["rewrittenOverview"] = rewritten.ToString().Trim(),
        };

        return root.ToJsonString(new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }

    /// <summary>
    ///     Removes simulator-generated intro prefixes and footers so repeated rewrites do not stack
    ///     <c>{system} — Business outcome: …</c> lines on every accept → rewrite cycle.
    /// </summary>
    internal static string StripSimulatorGeneratedArtifacts(
        string overview,
        string systemName,
        string businessOutcome)
    {
        if (string.IsNullOrWhiteSpace(overview))
            return string.Empty;

        string trimmed = overview.Trim();
        string introPrefix = BuildIntroPrefix(systemName, businessOutcome);

        if (introPrefix.Length > 0)
        {
            while (trimmed.StartsWith(introPrefix, StringComparison.OrdinalIgnoreCase))
                trimmed = trimmed[introPrefix.Length..].TrimStart();
        }

        const string footerMarker = "(Simulator mode — deterministic rewrite";

        int footerIndex = trimmed.LastIndexOf(footerMarker, StringComparison.Ordinal);

        if (footerIndex >= 0)
            trimmed = trimmed[..footerIndex].TrimEnd();

        return trimmed;
    }

    private static string BuildIntroPrefix(string systemName, string businessOutcome)
    {
        if (systemName.Length == 0)
            return string.Empty;

        if (businessOutcome.Length == 0)
            return $"{systemName} — ";

        return $"{systemName} — Business outcome: {businessOutcome}.";
    }

    private static void AppendGroundingSection(StringBuilder builder, string title, IReadOnlyList<string> items)
    {
        if (items.Count == 0)
            return;

        builder.AppendLine();
        builder.AppendLine();
        builder.Append(title).Append(':');

        foreach (string item in items)
            builder.AppendLine().Append("- ").Append(item);
    }

    private static string ExtractLineValue(string userPrompt, string label)
    {
        foreach (string line in userPrompt.Split('\n'))
        {
            ReadOnlySpan<char> span = line.AsSpan().Trim();

            if (!span.StartsWith(label, StringComparison.OrdinalIgnoreCase))
                continue;

            return span.Length > label.Length ? span[label.Length..].Trim().ToString() : string.Empty;
        }

        return string.Empty;
    }

    private static string ExtractSection(string userPrompt, string sectionHeader)
    {
        int headerIndex = userPrompt.IndexOf(sectionHeader, StringComparison.Ordinal);

        if (headerIndex < 0)
            return string.Empty;

        int contentStart = headerIndex + sectionHeader.Length;

        if (contentStart < userPrompt.Length && userPrompt[contentStart] == '\n')
            contentStart++;

        int contentEnd = userPrompt.Length;

        foreach (string marker in new[]
                 {
                     "\n\nConfirmed constraints:",
                     "\n\nConfirmed assumptions:",
                     "\n\nConfirmed required capabilities:",
                     "\n\nDenied constraints",
                     "\n\nDenied assumptions",
                     "\n\nDenied required capabilities",
                 })
        {
            int markerIndex = userPrompt.IndexOf(marker, contentStart, StringComparison.Ordinal);

            if (markerIndex >= 0 && markerIndex < contentEnd)
                contentEnd = markerIndex;
        }

        return userPrompt[contentStart..contentEnd].Trim();
    }

    private static List<string> ExtractBulletList(string userPrompt, string sectionHeader)
    {
        int headerIndex = userPrompt.IndexOf(sectionHeader, StringComparison.Ordinal);

        if (headerIndex < 0)
            return [];

        int lineStart = headerIndex + sectionHeader.Length;

        if (lineStart < userPrompt.Length && userPrompt[lineStart] == '\n')
            lineStart++;

        List<string> items = [];

        foreach (string line in userPrompt[lineStart..].Split('\n'))
        {
            ReadOnlySpan<char> span = line.AsSpan().Trim();

            if (span.Length == 0)
                break;

            if (!span.StartsWith("- ", StringComparison.Ordinal))
                break;

            string item = span[2..].Trim().ToString();

            if (item.Length > 0)
                items.Add(item);
        }

        return items;
    }
}
