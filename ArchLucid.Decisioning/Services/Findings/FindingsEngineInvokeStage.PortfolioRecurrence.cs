using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Services.Findings;

partial class FindingsEngineInvokeStage
{
    private static IReadOnlyCollection<string> CollectPortfolioRecurrenceIdentities(IEnumerable<Finding> findings)
    {
        HashSet<string> identities = new(StringComparer.Ordinal);

        foreach (Finding finding in findings)
        {
            if (finding.IsMuted)
                continue;

            if (finding.Classification == FindingClassification.ChecklistCoverage)
                continue;

            identities.Add(FindingSnapshotMergeKey.FromFinding(finding));
        }

        return identities;
    }
}
