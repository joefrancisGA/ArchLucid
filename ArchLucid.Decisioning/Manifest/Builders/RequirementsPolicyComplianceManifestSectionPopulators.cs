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

/// <summary>Populates manifest provenance and honesty warnings from snapshots and trace.</summary>
public sealed class ProvenanceManifestSectionPopulator
{
    public void Populate(
        ManifestDocument manifest,
        FindingsSnapshot findingsSnapshot,
        RuleAuditTracePayload trace)
    {
        manifest.Provenance.SourceFindingIds = findingsSnapshot.Findings
            .Select(f => f.FindingId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Provenance.SourceGraphNodeIds = findingsSnapshot.Findings
            .SelectMany(f => f.RelatedNodeIds)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Provenance.AppliedRuleIds = trace.AppliedRuleIds
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        AppendManifestHonestyWarnings(manifest, findingsSnapshot);
    }

    private static void AppendManifestHonestyWarnings(ManifestDocument manifest, FindingsSnapshot findingsSnapshot)
    {
        if (findingsSnapshot.EvaluationConfidenceEnrichmentSkipped)

            manifest.Warnings.Add(
                "Evaluation confidence enrichment was skipped for this host profile; finding evaluation scores may be absent.");

        if (findingsSnapshot.EngineFailures.Count == 0)
            return;

        manifest.Warnings.Add(
            "Degraded finding coverage: one or more finding engines failed during snapshot generation; review findings may be incomplete.");

        manifest.Warnings.Add(
            $"Finding engines: {findingsSnapshot.EngineFailures.Count} failed during snapshot generation; findings may be incomplete.");

        foreach (FindingEngineFailure failure in findingsSnapshot.EngineFailures)

            manifest.Warnings.Add(
                $"Finding engine failure [{failure.EngineType}/{failure.Category}]: {failure.ExceptionType} — {failure.ErrorMessage}");
    }
}
