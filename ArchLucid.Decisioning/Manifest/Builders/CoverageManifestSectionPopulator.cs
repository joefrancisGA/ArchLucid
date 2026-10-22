using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>Populates manifest coverage warnings across topology, security, policy, and requirements.</summary>
public sealed class CoverageManifestSectionPopulator : IManifestSectionPopulator
{
    public string SectionName => "Coverage";

    public void Populate(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.TopologyCoverageFinding))
        {
            TopologyCoverageFindingPayload? payload = FindingPayloadConverter.ToTopologyCoveragePayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "TopologyCoverage");
                continue;
            }

            if (payload.MissingCategories.Count == 0)
                continue;

            foreach (string category in payload.MissingCategories)
                manifest.Topology.Gaps.Add($"Missing topology category: {category}");

            manifest.UnresolvedIssues.Items.Add(new ManifestIssue
            {
                IssueType = "TopologyCoverage",
                Title = finding.Title,
                Description = string.Join(", ", payload.MissingCategories),
                Severity = finding.Severity.ToString(),
                SupportingFindingIds = [finding.FindingId]
            });
        }

        foreach (Finding finding in findingsByType.GetByType(FindingTypes.SecurityCoverageFinding))
        {
            SecurityCoverageFindingPayload? payload = FindingPayloadConverter.ToSecurityCoveragePayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "SecurityCoverage");
                continue;
            }

            foreach (string resource in payload.UnprotectedResources)
                manifest.Security.Gaps.Add($"{resource} is not protected");

            manifest.UnresolvedIssues.Items.Add(new ManifestIssue
            {
                IssueType = "SecurityCoverage",
                Title = finding.Title,
                Description = string.Join(", ", payload.UnprotectedResources),
                Severity = finding.Severity.ToString(),
                SupportingFindingIds = [finding.FindingId]
            });
        }

        foreach (Finding finding in findingsByType.GetByType(FindingTypes.PolicyCoverageFinding))
        {
            PolicyCoverageFindingPayload? payload = FindingPayloadConverter.ToPolicyCoveragePayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "PolicyCoverageWarnings");
                continue;
            }

            manifest.UnresolvedIssues.Items.Add(new ManifestIssue
            {
                IssueType = "PolicyCoverage",
                Title = finding.Title,
                Description = payload.UncoveredResources.Count == 0
                    ? finding.Rationale
                    : string.Join(", ", payload.UncoveredResources),
                Severity = finding.Severity.ToString(),
                SupportingFindingIds = [finding.FindingId]
            });
        }

        foreach (Finding finding in findingsByType.GetByType(FindingTypes.RequirementCoverageFinding))
        {
            if (string.Equals(finding.EngineType, "requirement-cross-run-diff", StringComparison.OrdinalIgnoreCase))
                continue;

            RequirementCoverageFindingPayload? payload = FindingPayloadConverter.ToRequirementCoveragePayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "RequirementCoverage");
                continue;
            }

            foreach (string req in payload.UncoveredRequirements)

                manifest.Requirements.Uncovered.Add(new RequirementCoverageItem
                {
                    RequirementName = req,
                    RequirementText = req,
                    IsMandatory = true,
                    CoverageStatus = "Uncovered",
                    SupportingFindingIds = [finding.FindingId]
                });
        }
    }
}
