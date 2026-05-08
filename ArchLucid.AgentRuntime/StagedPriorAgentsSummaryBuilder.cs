using System.Globalization;
using System.Text;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Builds a bounded, redacted summary of non-Critic <see cref="AgentResult" /> rows for staged Critic execution.
/// </summary>
public static class StagedPriorAgentsSummaryBuilder
{
    /// <summary>Creates an <see cref="EvidenceNote" /> suitable for <see cref="EvidenceNoteTypes.StagedPriorAgentsSummary"/>.</summary>
    public static EvidenceNote CreateNote(IReadOnlyList<AgentResult> priorResults, StagedCriticAgentOptions options)
    {
        ArgumentNullException.ThrowIfNull(priorResults);
        ArgumentNullException.ThrowIfNull(options);

        options.Normalize();

        string body = BuildBody(priorResults, options);

        return new EvidenceNote
        {
            NoteType = EvidenceNoteTypes.StagedPriorAgentsSummary,
            Message = body,
        };
    }

    private static string BuildBody(IReadOnlyList<AgentResult> priorResults, StagedCriticAgentOptions options)
    {
        if (priorResults.Count == 0)
        {
            return "No prior agent results were present in this batch (Critic ran without upstream completes). "
                   + "Rely on the architecture request and evidence package only.";
        }

        StringBuilder sb = new();
        int budget = options.SummaryMaxTotalChars;

        foreach (AgentResult r in priorResults.OrderBy(static x => x.AgentType))
        {
            if (budget <= 0)
                break;

            if (r.AgentType == AgentType.Critic)
                continue;

            string section = BuildAgentSection(r, options);
            section = RedactAndTruncateSection(section, options.SummaryPerAgentMaxChars);

            if (section.Length > budget)
            {
                section = section[..budget] + "…";
            }

            _ = sb.AppendLine(section.TrimEnd());
            _ = sb.AppendLine();
            budget -= section.Length;

            if (budget <= 0)
                break;
        }

        string total = sb.ToString().Trim();

        if (total.Length > options.SummaryMaxTotalChars)
        {
            total = total[..options.SummaryMaxTotalChars].TrimEnd() + "…";
        }

        return total;
    }

    private static string BuildAgentSection(AgentResult r, StagedCriticAgentOptions options)
    {
        StringBuilder sb = new();
        IFormatProvider inv = CultureInfo.InvariantCulture;

        _ = sb.Append("## ")
            .Append(r.AgentType.ToString())
            .Append(" (resultId ")
            .Append(r.ResultId)
            .AppendLine(")");

        _ = sb.Append("- confidence: ")
            .Append(r.Confidence.ToString("0.###", inv))
            .Append(", claims: ")
            .Append(r.Claims.Count.ToString(inv))
            .Append(", findings: ")
            .Append(r.Findings.Count.ToString(inv))
            .Append(", evidenceRefs: ")
            .Append(r.EvidenceRefs.Count.ToString(inv))
            .AppendLine();

        if (r.Findings.Count > 0)
        {
            Dictionary<string, int> sev = [];

            foreach (string key in r.Findings.Select(f => f.Severity.ToString()))
            {
                if (!sev.TryGetValue(key, out int n))
                    n = 0;

                sev[key] = n + 1;
            }

            _ = sb.Append("- findingsBySeverity: ")
                .AppendLine(string.Join(", ", sev.Select(static kv => $"{kv.Key}={kv.Value}")));
        }

        if (options.MaxFindingTitlesPerAgent > 0 && r.Findings.Count > 0)
        {
            _ = sb.AppendLine("- findingTitles (truncated):");

            foreach (ArchitectureFinding f in r.Findings.Take(options.MaxFindingTitlesPerAgent))
            {
                string title = PickFindingTitle(f);
                title = RedactAndClip(title, options.MaxFindingTitleChars);

                if (string.IsNullOrWhiteSpace(title))
                    continue;

                _ = sb.Append("  - ")
                    .Append(f.Severity.ToString())
                    .Append(": ")
                    .AppendLine(title);
            }
        }

        if (options.MaxClaimsPerAgentIncluded <= 0 || r.Claims.Count <= 0)
            return sb.ToString();
        _ = sb.AppendLine("- claimExcerpts (truncated, redacted):");

        foreach (string c in r.Claims.Take(options.MaxClaimsPerAgentIncluded))
        {
            string line = RedactAndClip(c, options.MaxClaimLineChars);

            if (string.IsNullOrWhiteSpace(line))
                continue;

            _ = sb.Append("  - ").AppendLine(line);
        }

        return sb.ToString();
    }

    private static string PickFindingTitle(ArchitectureFinding f)
    {
        if (!string.IsNullOrWhiteSpace(f.Message))
            return f.Message.Trim();

        return !string.IsNullOrWhiteSpace(f.Category) ? f.Category.Trim() : f.FindingId;
    }

    private static string RedactAndTruncateSection(string section, int maxChars)
    {
        if (string.IsNullOrEmpty(section))
            return string.Empty;

        string redacted = RedactPotentiallySensitive(section);

        if (redacted.Length <= maxChars)
            return redacted;

        return redacted[..maxChars].TrimEnd() + "…";
    }

    private static string RedactAndClip(string? text, int maxChars)
    {
        string s = RedactPotentiallySensitive(text ?? string.Empty).Trim();

        if (s.Length <= maxChars)
            return s;

        return s[..maxChars].TrimEnd() + "…";
    }

    private static string RedactPotentiallySensitive(string text)
    {
        return PromptFieldRedactor.RedactForPrompt(text);
    }
}
