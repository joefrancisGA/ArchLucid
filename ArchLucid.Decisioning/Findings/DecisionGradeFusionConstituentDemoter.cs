using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     DX-71: after fusion rows are appended, reclassify fused constituents to checklist so the
///     synthesis row is the only Decision-grade claim for that cluster. Constituents stay on the package.
/// </summary>
public static class DecisionGradeFusionConstituentDemoter
{
    public static void DemoteFusedConstituents(
        IReadOnlyList<Finding> packageFindings,
        IReadOnlyList<Finding> fusionFindings)
    {
        ArgumentNullException.ThrowIfNull(packageFindings);
        ArgumentNullException.ThrowIfNull(fusionFindings);

        if (fusionFindings.Count == 0 || packageFindings.Count == 0)
            return;

        HashSet<string> fusionIds = fusionFindings
            .Where(static finding => finding is not null && !string.IsNullOrWhiteSpace(finding.FindingId))
            .Select(static finding => finding.FindingId)
            .ToHashSet(StringComparer.Ordinal);

        foreach (Finding fusion in fusionFindings)
        {
            if (fusion is null)
                continue;

            CopyMaxConstituentScoreIfUnset(packageFindings, fusion);

            foreach (string constituentId in CollectConstituentFindingIds(fusion))
            {
                if (fusionIds.Contains(constituentId))
                    continue;

                Finding? constituent = packageFindings.FirstOrDefault(finding =>
                    finding is not null
                    && string.Equals(finding.FindingId, constituentId, StringComparison.Ordinal));

                if (constituent is null)
                    continue;

                if (string.Equals(
                        constituent.EngineType,
                        DecisionGradeFusionApplicator.EngineType,
                        StringComparison.OrdinalIgnoreCase))
                    continue;

                if (constituent.Classification == FindingClassification.ChecklistCoverage)
                    continue;

                constituent.Classification = FindingClassification.ChecklistCoverage;
                constituent.Treatment = FindingTreatment.DemoteToChecklist;
                AppendFusedIntoNote(constituent, fusion.FindingId);
            }
        }
    }

    private static void CopyMaxConstituentScoreIfUnset(IReadOnlyList<Finding> packageFindings, Finding fusion)
    {
        if (fusion.InsightDensityScore is > 0)
            return;

        List<int> scores = CollectConstituentFindingIds(fusion)
            .Select(constituentId => packageFindings.FirstOrDefault(finding =>
                finding is not null
                && string.Equals(finding.FindingId, constituentId, StringComparison.Ordinal)))
            .Where(static constituent => constituent?.InsightDensityScore is int)
            .Select(static constituent => constituent!.InsightDensityScore!.Value)
            .ToList();

        if (scores.Count == 0)
            return;

        fusion.InsightDensityScore = scores.Max();
    }

    private static IReadOnlyList<string> CollectConstituentFindingIds(Finding fusion)
    {
        if (fusion.Payload is DecisionGradeFusionFindingPayload payload
            && payload.ConstituentFindingIds is { Count: > 0 })
        {
            return payload.ConstituentFindingIds
                .Where(static findingId => !string.IsNullOrWhiteSpace(findingId))
                .Select(static findingId => findingId.Trim())
                .ToList();
        }

        return [];
    }

    private static void AppendFusedIntoNote(Finding constituent, string fusionFindingId)
    {
        if (string.IsNullOrWhiteSpace(fusionFindingId))
            return;

        string note = $"evidence:fused-into:{fusionFindingId.Trim()}";
        constituent.Trace ??= new ExplainabilityTrace();
        constituent.Trace.Notes ??= [];

        if (constituent.Trace.Notes.Any(existing =>
                string.Equals(existing, note, StringComparison.OrdinalIgnoreCase)))
            return;

        constituent.Trace.Notes.Add(note);
    }
}
