using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>Populates manifest requirements and requirement-gap decisions.</summary>
public sealed class RequirementsManifestSectionPopulator : IManifestSectionPopulator
{
    public string SectionName => "Requirements";

    public void Populate(ManifestDocument manifest, FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.RequirementFinding))
        {
            RequirementFindingPayload? payload = FindingPayloadConverter.ToRequirementPayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, SectionName);
                continue;
            }

            RequirementCoverageItem item = new()
            {
                RequirementName = payload.RequirementName,
                RequirementText = payload.RequirementText,
                IsMandatory = payload.IsMandatory,
                CoverageStatus = "Covered",
                SupportingFindingIds = [finding.FindingId]
            };

            manifest.Requirements.Covered.Add(item);

            ResolvedArchitectureDecision requirementDecision = new()
            {
                Category = "Requirement",
                Title = payload.RequirementName,
                SelectedOption = "Accepted",
                Rationale = payload.RequirementText,
                SupportingFindingIds = [finding.FindingId]
            };
            ManifestDecisionConfidenceProjector.ApplyTo(requirementDecision, finding);
            manifest.Decisions.Add(requirementDecision);
        }

        PopulateRequirementTraceabilityDecisions(manifest, findingsByType);
    }

    private static void PopulateRequirementTraceabilityDecisions(
        ManifestDocument manifest,
        FindingsSnapshotTypeIndex findingsByType)
    {
        foreach (Finding finding in findingsByType.GetByType(FindingTypes.RequirementGap))
        {
            TopologyGapFindingPayload? payload = FindingPayloadConverter.ToTopologyGapPayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "RequirementGap");
                continue;
            }

            AddRequirementManifestDecision(
                manifest,
                finding,
                payload.Description,
                payload.Impact,
                "RemediationRequired");
        }

        foreach (Finding finding in findingsByType.GetByType(FindingTypes.RequirementCoverageFinding))
        {
            if (IsRequirementCrossRunDiffFinding(finding))
                continue;

            RequirementCoverageFindingPayload? payload = FindingPayloadConverter.ToRequirementCoveragePayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "RequirementCoverageDecision");
                continue;
            }

            AddRequirementManifestDecision(
                manifest,
                finding,
                finding.Rationale,
                payload.UncoveredRequirements.Count == 0
                    ? finding.Rationale
                    : string.Join(", ", payload.UncoveredRequirements),
                "CloseCoverageGap");
        }

        foreach (Finding finding in findingsByType.GetByType(FindingTypes.RequirementExpectationFinding))
        {
            RequirementExpectationFindingPayload? payload =
                FindingPayloadConverter.ToRequirementExpectationPayload(finding);

            if (payload is null)
            {
                ManifestSectionPopulatorSupport.WarnSkippedFindingPayload(manifest, finding, "RequirementExpectationDecision");
                continue;
            }

            AddRequirementManifestDecision(
                manifest,
                finding,
                finding.Rationale,
                payload.MissingThemes.Count == 0
                    ? finding.Rationale
                    : string.Join(", ", payload.MissingThemes),
                "AddMissingThemes");
        }
    }

    private static void AddRequirementManifestDecision(
        ManifestDocument manifest,
        Finding finding,
        string rationale,
        string impact,
        string selectedOption)
    {
        manifest.UnresolvedIssues.Items.Add(new ManifestIssue
        {
            IssueType = finding.FindingType,
            Title = finding.Title,
            Description = impact,
            Severity = finding.Severity.ToString(),
            SupportingFindingIds = [finding.FindingId]
        });

        ResolvedArchitectureDecision decision = new()
        {
            Category = "Requirement",
            Title = finding.Title,
            SelectedOption = selectedOption,
            Rationale = rationale,
            SupportingFindingIds = [finding.FindingId]
        };
        ManifestDecisionConfidenceProjector.ApplyTo(decision, finding);
        manifest.Decisions.Add(decision);
    }

    private static bool IsRequirementCrossRunDiffFinding(Finding finding) =>
        string.Equals(finding.EngineType, "requirement-cross-run-diff", StringComparison.OrdinalIgnoreCase);
}
