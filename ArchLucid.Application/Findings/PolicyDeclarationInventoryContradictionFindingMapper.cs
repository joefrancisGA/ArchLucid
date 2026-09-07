using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings;

internal static class PolicyDeclarationInventoryContradictionFindingMapper
{
    internal static Finding ToFinding(
        DeclarationInventoryContradictionMismatch mismatch,
        string policyRuleId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(policyRuleId);

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.PolicyDeclarationInventoryContradictionFinding,
            Category = "Security",
            EngineType = "policy-declaration-inventory-contradiction",
            Severity = FindingSeverity.Error,
            Title =
                $"Pack rule '{policyRuleId}' on '{mismatch.ResourceLabel}': declaration {mismatch.DeclarationKey} '{mismatch.DeclarationValue}' vs inventory '{mismatch.InventoryValue}'",
            Rationale =
                "The tenant's assigned policy pack requires this control, the declaration claims one posture, and scoped live inventory reports the opposite.",
            RelatedNodeIds = [mismatch.GraphNodeId],
            PayloadType = nameof(PolicyDeclarationInventoryContradictionFindingPayload),
            Payload = new PolicyDeclarationInventoryContradictionFindingPayload
            {
                PolicyRuleId = policyRuleId,
                ResourceLabel = mismatch.ResourceLabel,
                DeclarationKey = mismatch.DeclarationKey,
                DeclaredValue = mismatch.DeclarationValue,
                InventoryValue = mismatch.InventoryValue,
                CloudProvider = mismatch.CloudLabel,
            },
            PolicyRuleId = policyRuleId,
            RecommendedActions =
            [
                "Reconcile the declaration with live inventory or remediate inventory to satisfy the assigned pack control.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [mismatch.GraphNodeId],
                RulesApplied = [policyRuleId, mismatch.SecurityTheme, "policy-declaration-inventory-contradiction"],
                DecisionsTaken =
                [
                    "Assigned pack maps the mismatch theme; declaration and inventory disagree on the same security property.",
                ],
                Notes =
                [
                    $"evidence:graph-node:{mismatch.GraphNodeId}",
                    $"evidence:inventory:{mismatch.InventoryResourceId}",
                    $"evidence:policy:{policyRuleId}",
                ],
            },
        };
    }
}
