using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings.ProseAssumption;

/// <summary>Maps prose-assumption inventory contradictions to declaration-premise-conflict findings (DX-55).</summary>
internal static class ProseAssumptionContradictionFindingEmitter
{
    internal const string ProseAssumptionSource = "prose-assumption";

    internal static Finding ToFinding(ProseAssumptionContradictionMatch match)
    {
        ArgumentNullException.ThrowIfNull(match);

        List<string> evidenceRefs = [match.Candidate.EvidenceRef];
        FindingEvidenceRefs.TryAppendInventoryResourceId(evidenceRefs, match.InventoryResourceId);

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "DeclarationPremiseConflictFinding",
            Category = "Security",
            EngineType = "declaration-premise-conflict",
            Severity = FindingSeverity.Warning,
            Title =
                $"{match.ResourceLabel} prose assumption contradicts live inventory ({match.InventoryPropertyKey}={match.InventoryValue})",
            Rationale =
                $"In-batch prose states \"{match.Candidate.QuotedSpan}\" while scoped {match.CloudLabel} inventory reports "
                + $"'{match.InventoryPropertyKey}' as '{match.InventoryValue}'.",
            RelatedNodeIds = [match.GraphNodeId],
            EvidenceRefs = evidenceRefs,
            PayloadType = nameof(DeclarationPremiseConflictFindingPayload),
            Payload = new DeclarationPremiseConflictFindingPayload
            {
                ConflictKind = "prose-inventory-contradiction",
                DeclarationPropertyKey = match.Candidate.LogicalPropertyName ?? string.Empty,
                DeclarationPropertyValue = match.Candidate.ImpliedPropertyValue ?? string.Empty,
                IntentNodeId = match.GraphNodeId,
                IntentRequirementText = match.Candidate.Statement,
                IsNarrowApplicability = false,
                TopologyNodeId = match.GraphNodeId,
                Source = ProseAssumptionSource,
            },
            RecommendedActions =
            [
                "Reconcile the prose assumption with measured inventory posture or update the architecture narrative.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [match.GraphNodeId],
                RulesApplied = ["declaration-premise-conflict", ProseAssumptionSource],
                DecisionsTaken =
                [
                    "Compared mapped prose assumption to inventory row properties for the same resource identifier.",
                ],
                Notes =
                [
                    match.Candidate.EvidenceRef,
                    $"evidence:inventory:{match.InventoryResourceId}",
                    $"evidence:graph-node:{match.GraphNodeId}",
                ],
            },
        };
    }
}
