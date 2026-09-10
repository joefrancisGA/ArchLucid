using ArchLucid.Application.Analysis;
using ArchLucid.ArtifactSynthesis.Classifiers;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings;

internal static class InventorySecurityBaselineFindingMapper
{
    internal static Finding ToFinding(
        InventorySecurityBaselineFinding gap,
        string engineType,
        string findingType,
        string cloudLabel,
        InventoryTopologyResourceNodeIndex topologyNodes,
        string? policyRuleId = null)
    {
        List<string> rulesApplied = policyRuleId is null
            ? [$"{engineType}-classifier"]
            : [policyRuleId, gap.ControlFamily, $"{engineType}-classifier"];

        List<string> evidenceRefs = [];
        FindingEvidenceRefs.TryAppendInventoryResourceId(evidenceRefs, gap.ResourceId);
        FindingEvidenceRefs.TryAppendPolicyRuleId(evidenceRefs, policyRuleId);

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = findingType,
            Category = "Security",
            EngineType = engineType,
            Severity = FindingSeverity.Warning,
            Title = $"{cloudLabel} inventory security baseline gap: {gap.ResourceType}",
            Rationale =
                $"{cloudLabel} inventory resources.json cross-check flagged a security baseline gap grounded in measured inventory.",
            RelatedNodeIds = topologyNodes.Resolve(gap.ResourceId).ToList(),
            EvidenceRefs = evidenceRefs,
            PayloadType = nameof(RequirementFindingPayload),
            Payload = new RequirementFindingPayload
            {
                RequirementName = gap.ResourceId,
                RequirementText = gap.Message,
                IsMandatory = false,
            },
            PolicyRuleId = policyRuleId,
            Trace = new ExplainabilityTrace
            {
                RulesApplied = rulesApplied,
                DecisionsTaken =
                [
                    $"Mapped inventory row to control family '{gap.ControlFamily}' and emitted a typed security finding.",
                ],
                Notes =
                [
                    $"Resource type: {gap.ResourceType}",
                    $"Resource id: {gap.ResourceId}",
                    $"Control family: {gap.ControlFamily}",
                ],
            },
        };
    }
}
