using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Hydrates TB-382 insight-density fields from dual-written <c>FindingsJson</c> when relational columns are absent.
/// </summary>
internal static class FindingInsightDensityJsonMerger
{
    internal static void MergeFromFindingsJson(IReadOnlyList<Finding> relationalFindings, string? findingsJson)
    {
        ArgumentNullException.ThrowIfNull(relationalFindings);

        if (relationalFindings.Count == 0 || string.IsNullOrWhiteSpace(findingsJson))
            return;

        List<Finding> jsonFindings = FindingsSnapshotLegacyJsonReader.DeserializeFindings(findingsJson);

        if (jsonFindings.Count == 0)
            return;

        Dictionary<string, Finding> byFindingId = jsonFindings
            .Where(static finding => !string.IsNullOrWhiteSpace(finding.FindingId))
            .ToDictionary(static finding => finding.FindingId, StringComparer.Ordinal);

        foreach (Finding finding in relationalFindings)
        {
            if (!byFindingId.TryGetValue(finding.FindingId, out Finding? jsonFinding))
                continue;

            finding.InsightDensityScore = jsonFinding.InsightDensityScore;
            finding.Treatment = jsonFinding.Treatment;
            finding.Classification = jsonFinding.Classification;
            finding.WhyThisIsNotGeneric = jsonFinding.WhyThisIsNotGeneric;
            finding.PrincipalArchitectValue = jsonFinding.PrincipalArchitectValue;
            finding.DecisionConsequence = jsonFinding.DecisionConsequence;
        }
    }
}
