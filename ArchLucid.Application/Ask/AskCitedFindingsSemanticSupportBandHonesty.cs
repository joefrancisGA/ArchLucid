using System.Text.Json;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Ask;

/// <summary>
///     AS-069: Ask answers that cite findings inherit the weakest semantic support band (WA-07 leftover).
/// </summary>
public static class AskCitedFindingsSemanticSupportBandHonesty
{
    public const string NotSealedRecordCopy =
        "Ask is advisory working context — not the sealed review record (TB-1003).";

    public const string PromptConstraintPrefix =
        "Semantic support band honesty (AS-069 / ADR 0085):";

    public sealed record FindingBandIndexEntry(string FindingId, string Title, FindingSemanticSupportBand Band);

    public static IReadOnlyList<FindingBandIndexEntry> BuildDecisionGradeFindingBandIndex(
        FindingsSnapshot? snapshot)
    {
        if (snapshot?.Findings is not { Count: > 0 } findings)
        {
            return [];
        }

        List<FindingBandIndexEntry> entries = [];

        foreach (Finding finding in findings)
        {
            if (finding.IsMuted)
            {
                continue;
            }

            if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
            {
                continue;
            }

            string findingId = finding.FindingId?.Trim() ?? string.Empty;

            if (findingId.Length == 0)
            {
                continue;
            }

            FindingSemanticSupportBand band = ResolveDecisionGradeSemanticSupportBand(finding.SemanticSupportBand);
            string title = ResolveFindingTitle(finding);
            entries.Add(new FindingBandIndexEntry(findingId, title, band));
        }

        return entries;
    }

    public static FindingSemanticSupportBand? ResolveWeakestBand(
        IReadOnlyList<FindingSemanticSupportBand> bands)
    {
        if (bands is not { Count: > 0 })
        {
            return null;
        }

        FindingSemanticSupportBand weakest = bands[0];

        for (int index = 1; index < bands.Count; index++)
        {
            FindingSemanticSupportBand candidate = bands[index];

            if (CompareBandWeakness(candidate, weakest) > 0)
            {
                weakest = candidate;
            }
        }

        return weakest;
    }

    public static FindingSemanticSupportBand? ResolveWeakestBandForFindingIds(
        IReadOnlyList<FindingBandIndexEntry> index,
        IReadOnlyList<string> referencedFindingIds)
    {
        ArgumentNullException.ThrowIfNull(index);
        ArgumentNullException.ThrowIfNull(referencedFindingIds);

        if (referencedFindingIds.Count == 0)
        {
            return null;
        }

        HashSet<string> normalizedIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (string rawId in referencedFindingIds)
        {
            string trimmed = rawId.Trim();

            if (trimmed.Length > 0)
            {
                normalizedIds.Add(trimmed);
            }
        }

        if (normalizedIds.Count == 0)
        {
            return null;
        }

        List<FindingSemanticSupportBand> matchedBands = [];

        foreach (FindingBandIndexEntry entry in index)
        {
            if (!normalizedIds.Contains(entry.FindingId))
            {
                continue;
            }

            matchedBands.Add(entry.Band);
        }

        return ResolveWeakestBand(matchedBands);
    }

    public static string BuildPromptConstraintSection(IReadOnlyList<FindingBandIndexEntry> index)
    {
        if (index.Count == 0)
        {
            return string.Empty;
        }

        List<string> lines =
        [
            PromptConstraintPrefix,
            "When you quote or rely on a finding, your answer must not sound more certain than that finding's semantic support band.",
            "Among cited findings, inherit the weakest band and use cautious language for Unsupported or Unchecked rows.",
            "Supported does not mean legal truth or auditor conclusion.",
            NotSealedRecordCopy,
            "Decision-grade finding semantic support bands:",
        ];

        foreach (FindingBandIndexEntry entry in index)
        {
            lines.Add(
                $"- {entry.FindingId}: {entry.Band} — {entry.Title}");
        }

        return string.Join(Environment.NewLine, lines) + Environment.NewLine;
    }

    public static string? FormatWeakestBandFootnote(FindingSemanticSupportBand? weakestBand)
    {
        if (weakestBand is null)
        {
            return null;
        }

        return
            $"Cited findings inherit the weakest semantic support band: {weakestBand.Value}. " +
            "Ask cannot sound more certain than that band. " +
            NotSealedRecordCopy;
    }

    public static FindingSemanticSupportBand? TryReadBandFromFindingInspect(FindingInspectResponse? finding)
    {
        if (finding?.TypedPayload is not { } payload || payload.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        if (!payload.TryGetProperty("semanticSupportBand", out JsonElement bandElement)
            && !payload.TryGetProperty("SemanticSupportBand", out bandElement))
        {
            return null;
        }

        if (bandElement.ValueKind == JsonValueKind.String)
        {
            string? raw = bandElement.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && Enum.TryParse(raw.Trim(), ignoreCase: true, out FindingSemanticSupportBand parsed)
                && Enum.IsDefined(parsed))
            {
                return parsed;
            }
        }

        if (bandElement.ValueKind == JsonValueKind.Number
            && bandElement.TryGetInt32(out int numeric)
            && Enum.IsDefined(typeof(FindingSemanticSupportBand), numeric))
        {
            return (FindingSemanticSupportBand)numeric;
        }

        return null;
    }

    public static FindingSemanticSupportBand ResolveDecisionGradeSemanticSupportBand(
        FindingSemanticSupportBand? raw) =>
        raw ?? FindingSemanticSupportBand.NotScored;

    internal static int CompareBandWeakness(
        FindingSemanticSupportBand left,
        FindingSemanticSupportBand right) =>
        BandWeaknessRank(left).CompareTo(BandWeaknessRank(right));

    private static int BandWeaknessRank(FindingSemanticSupportBand band) =>
        band switch
        {
            FindingSemanticSupportBand.Supported => 0,
            FindingSemanticSupportBand.NotScored => 1,
            FindingSemanticSupportBand.Unchecked => 2,
            FindingSemanticSupportBand.Unsupported => 3,
            _ => 1,
        };

    private static string ResolveFindingTitle(Finding finding)
    {
        string title = finding.Title?.Trim() ?? string.Empty;

        if (title.Length > 0)
        {
            return title.Length <= 96 ? title : string.Concat(title.AsSpan(0, 93), "...");
        }

        string rationale = finding.Rationale?.Trim() ?? string.Empty;

        if (rationale.Length > 0)
        {
            return rationale.Length <= 96 ? rationale : string.Concat(rationale.AsSpan(0, 93), "...");
        }

        return finding.FindingId?.Trim() ?? "finding";
    }
}
