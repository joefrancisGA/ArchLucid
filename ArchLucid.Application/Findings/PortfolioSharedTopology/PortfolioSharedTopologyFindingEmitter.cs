using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings.PortfolioSharedTopology;

public sealed class PortfolioSharedTopologyFindingEmitter : IPortfolioSharedTopologyFindingEmitter
{
    private const string Category = "Topology";
    private const string EngineType = "portfolio-shared-topology";

    public IReadOnlyList<Finding> EmitFindings(
        IReadOnlyList<SharedTopologyConflict> conflicts,
        PortfolioSharedTopologyFindingOptions options)
    {
        ArgumentNullException.ThrowIfNull(conflicts);
        ArgumentNullException.ThrowIfNull(options);

        return conflicts
            .OrderBy(static conflict => conflict.CurrentEntry.ResourceIdNormalized, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static conflict => conflict.OtherSystemId, StringComparer.OrdinalIgnoreCase)
            .Take(options.MaxFindings)
            .Select(BuildFinding)
            .ToList();
    }

    private static Finding BuildFinding(SharedTopologyConflict conflict)
    {
        SharedResourcePostureEntry currentEntry = conflict.CurrentEntry;
        string? disagreementLabel = SharedResourcePostureCode.TryGetFirstDisagreementLabel(
            currentEntry.PostureCode,
            conflict.OtherPostureCode);
        string postureLabel = disagreementLabel ?? "posture";

        List<string> evidenceRefs = [];
        FindingEvidenceRefs.TryAppendInventoryResourceId(evidenceRefs, currentEntry.ResourceIdNormalized);

        PortfolioSharedTopologyFindingPayload payload = new()
        {
            ResourceIdNormalized = currentEntry.ResourceIdNormalized,
            OtherSystemId = conflict.OtherSystemId,
            OtherRunId = conflict.OtherRunId,
            ThisPosture = currentEntry.PostureCode,
            OtherPosture = conflict.OtherPostureCode,
        };

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "PortfolioSharedTopologyFinding",
            Category = Category,
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Title = $"Shared resource {currentEntry.ResourceIdNormalized} disagrees on {postureLabel} with system {conflict.OtherSystemId}",
            Rationale = BuildRationale(conflict, postureLabel),
            DecisionConsequence = BuildDecisionConsequence(conflict, postureLabel),
            RelatedNodeIds = [currentEntry.NodeId],
            EvidenceRefs = evidenceRefs,
            Payload = payload,
            PayloadType = nameof(PortfolioSharedTopologyFindingPayload),
            Trace = new ExplainabilityTrace
            {
                RulesApplied =
                [
                    EngineType,
                    currentEntry.ResourceIdNormalized,
                    conflict.OtherSystemId,
                ],
            },
        };
    }

    private static string BuildRationale(SharedTopologyConflict conflict, string postureLabel)
    {
        return
            $"This run and committed system '{conflict.OtherSystemId}' both reference inventory resource "
            + $"'{conflict.CurrentEntry.ResourceIdNormalized}', but {postureLabel} posture differs "
            + $"(this run: {conflict.CurrentEntry.PostureCode}; peer: {conflict.OtherPostureCode}).";
    }

    private static string BuildDecisionConsequence(SharedTopologyConflict conflict, string postureLabel)
    {
        return
            $"Reconcile shared resource posture for '{conflict.CurrentEntry.ResourceIdNormalized}' "
            + $"with system '{conflict.OtherSystemId}' before treating {postureLabel} as consistent across the portfolio.";
    }
}
