using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>Populates manifest compliance controls and gaps.</summary>
public sealed class ComplianceManifestSectionPopulator : IManifestSectionPopulator
{
    public string SectionName => "Compliance";

    public void Populate(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.ComplianceFinding))
        {
            ComplianceFindingPayload? payload = FindingPayloadConverter.ToCompliancePayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, SectionName);
                continue;
            }

            manifest.Compliance.Controls.Add(new CompliancePostureItem
            {
                ControlId = payload.ControlId,
                ControlName = payload.ControlName,
                AppliesToCategory = payload.AppliesToCategory,
                Status = "Gap"
            });

            if (payload.AffectedResources.Count > 0)

                manifest.Compliance.Gaps.Add(
                    $"{payload.ControlName}: {string.Join(", ", payload.AffectedResources)}");

            manifest.UnresolvedIssues.Items.Add(new ManifestIssue
            {
                IssueType = "ComplianceGap",
                Title = finding.Title,
                Description = finding.Rationale,
                Severity = finding.Severity.ToString(),
                SupportingFindingIds = [finding.FindingId]
            });
        }
    }
}
