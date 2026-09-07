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
        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.PolicyDeclarationInventoryContradictionFinding,
            Category = "Security",
            EngineType = "policy-declaration-inventory-contradiction",
            Severity = FindingSeverity.Warning,
            Title =
                $"Policy rule '{policyRuleId}' requires control on '{mismatch.ResourceLabel}' but inventory reports {mismatch.DeclarationKey} '{mismatch.InventoryValue}' while the declaration claims '{mismatch.DeclarationValue}'",
            Rationale =
                "The assigned policy pack requires this control, the architecture declaration asserts the secure posture, and scoped live inventory contradicts it.",
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
                "Align live inventory with the declared secure posture or update the declaration to match measured posture.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [mismatch.GraphNodeId],
                RulesApplied = [policyRuleId, mismatch.SecurityTheme],
                DecisionsTaken =
                [
                    "Filtered declaration-inventory mismatch to rows where the assigned pack maps the security theme and the declaration asserts the secure side.",
                ],
                Notes =
                [
                    $"evidence:inventory:{mismatch.InventoryResourceId}",
                    $"evidence:graph-node:{mismatch.GraphNodeId}",
                    $"evidence:policy:{policyRuleId}",
                ],
            },
        };
    }
}
