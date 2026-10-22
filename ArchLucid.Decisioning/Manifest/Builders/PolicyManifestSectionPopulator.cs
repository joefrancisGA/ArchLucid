using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>Populates manifest policy applicability, satisfied controls, and violations.</summary>
public sealed class PolicyManifestSectionPopulator : IManifestSectionPopulator
{
    public string SectionName => "Policy";

    public void Populate(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        PopulatePolicyApplicability(manifest, findingsByType);
        PopulatePolicySection(manifest, findingsByType);
    }

    private static void PopulatePolicyApplicability(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.PolicyApplicabilityFinding))
        {
            PolicyApplicabilityFindingPayload? payload = FindingPayloadConverter.ToPolicyApplicabilityPayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "PolicyApplicability");
                continue;
            }

            if (finding.Severity == FindingSeverity.Warning)
            {
                manifest.Warnings.Add($"{payload.PolicyName}: {finding.Title}");
                manifest.UnresolvedIssues.Items.Add(new ManifestIssue
                {
                    IssueType = "PolicyApplicabilityGap",
                    Title = finding.Title,
                    Description = finding.Rationale,
                    Severity = finding.Severity.ToString(),
                    SupportingFindingIds = [finding.FindingId]
                });
            }
            else if (finding.Severity == FindingSeverity.Info)

                manifest.Assumptions.Add(
                    $"Policy '{payload.PolicyName}' applies to {payload.ApplicableTopologyResourceCount} topology resource(s) (APPLIES_TO in knowledge graph).");
        }
    }

    private static void PopulatePolicySection(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.PolicyApplicabilityFinding))
        {
            PolicyApplicabilityFindingPayload? payload = FindingPayloadConverter.ToPolicyApplicabilityPayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "Policy");
                continue;
            }

            string pack = string.IsNullOrWhiteSpace(payload.PolicyReference) ? "Inferred" : payload.PolicyReference!;
            string controlId = string.IsNullOrWhiteSpace(payload.PolicyReference)
                ? payload.PolicyName
                : payload.PolicyReference!;

            if (finding.Severity == FindingSeverity.Info)

                manifest.Policy.SatisfiedControls.Add(new PolicyControlItem
                {
                    ControlId = controlId,
                    ControlName = payload.PolicyName,
                    PolicyPack = pack,
                    Description =
                        $"{payload.ApplicableTopologyResourceCount} topology resource(s) in APPLIES_TO scope."
                });

            else if (finding.Severity == FindingSeverity.Warning)

                manifest.Policy.Violations.Add(new PolicyControlItem
                {
                    ControlId = controlId,
                    ControlName = payload.PolicyName,
                    PolicyPack = pack,
                    Description = string.IsNullOrWhiteSpace(finding.Rationale) ? finding.Title : finding.Rationale
                });
        }

        foreach (Finding finding in findingsByType.GetByType(FindingTypes.PolicyCoverageFinding))
        {
            PolicyCoverageFindingPayload? payload = FindingPayloadConverter.ToPolicyCoveragePayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "PolicyCoverage");
                continue;
            }

            if (payload.UncoveredResources.Count == 0)
            {
                manifest.Policy.Violations.Add(new PolicyControlItem
                {
                    ControlId = "policy-coverage",
                    ControlName = "Policy topology coverage",
                    PolicyPack = "Governance",
                    Description = string.IsNullOrWhiteSpace(finding.Rationale) ? finding.Title : finding.Rationale
                });

                continue;
            }

            foreach (string resource in payload.UncoveredResources)

                manifest.Policy.Violations.Add(new PolicyControlItem
                {
                    ControlId = "policy-coverage",
                    ControlName = $"Uncovered: {resource}",
                    PolicyPack = "Governance",
                    Description = finding.Title
                });
        }
    }
}
