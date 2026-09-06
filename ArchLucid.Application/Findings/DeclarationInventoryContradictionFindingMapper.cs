using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings;

internal static class DeclarationInventoryContradictionFindingMapper
{
    internal static Finding ToFinding(
        DeclarationInventoryContradictionMismatch mismatch,
        string? policyRuleId)
    {
        List<string> rulesApplied = policyRuleId is null
            ? ["declaration-inventory-contradiction", mismatch.SecurityTheme]
            : [policyRuleId, mismatch.SecurityTheme];

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.DeclarationInventoryContradictionFinding,
            Category = "Security",
            EngineType = "declaration-inventory-contradiction",
            Severity = FindingSeverity.Warning,
            Title =
                $"'{mismatch.ResourceLabel}' declares {mismatch.DeclarationKey} '{mismatch.DeclarationValue}' but live inventory reports '{mismatch.InventoryValue}'",
            Rationale =
                "A security-relevant declaration property on the topology graph disagrees with the scoped live inventory snapshot for the same resource.",
            RelatedNodeIds = [mismatch.GraphNodeId],
            PayloadType = nameof(DeclarationInventoryContradictionFindingPayload),
            Payload = new DeclarationInventoryContradictionFindingPayload
            {
                ResourceLabel = mismatch.ResourceLabel,
                DeclarationKey = mismatch.DeclarationKey,
                DeclarationValue = mismatch.DeclarationValue,
                InventoryValue = mismatch.InventoryValue,
                Cloud = mismatch.CloudLabel,
                GraphNodeId = mismatch.GraphNodeId,
                InventoryResourceId = mismatch.InventoryResourceId,
            },
            PolicyRuleId = policyRuleId,
            RecommendedActions =
            [
                "Reconcile the declaration with live inventory or update the architecture graph to match measured posture.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [mismatch.GraphNodeId],
                RulesApplied = rulesApplied,
                DecisionsTaken =
                [
                    "Compared declaration property bag to inventory row properties for the same resource identifier.",
                ],
                Notes =
                [
                    $"evidence:inventory:{mismatch.InventoryResourceId}",
                    $"evidence:graph-node:{mismatch.GraphNodeId}",
                ],
            },
        };
    }
}
