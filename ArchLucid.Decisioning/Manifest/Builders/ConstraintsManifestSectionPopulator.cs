using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>Populates manifest constraints from accepted findings in the decision trace.</summary>
public sealed class ConstraintsManifestSectionPopulator
{
    public void Populate(
        ManifestDocument manifest,
        FindingsSnapshotIdIndex findingsById,
        RuleAuditTracePayload trace)
    {
        foreach (string findingId in trace.AcceptedFindingIds)
        {
            if (!findingsById.TryGet(findingId, out Finding? finding) || finding is null)
                continue;

            if (finding.Severity is FindingSeverity.Critical or FindingSeverity.Error)

                manifest.Constraints.MandatoryConstraints.Add(finding.Title);

            else if (finding.Severity is FindingSeverity.Info or FindingSeverity.Warning)

                manifest.Constraints.Preferences.Add(finding.Title);
        }
    }
}
