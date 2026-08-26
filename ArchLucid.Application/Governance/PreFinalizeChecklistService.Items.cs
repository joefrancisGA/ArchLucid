using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

public sealed partial class PreFinalizeChecklistService
{
    private static PreFinalizeChecklistItem BuildAssumedTechnologyItem(int assumedCount) =>
        new()
        {
            ItemId = "technology-baseline-assumed",
            Title = "Technology baseline confirmed",
            Detail = assumedCount == 0
                ? "No Assumed technology rows remain."
                : $"{assumedCount} technology row{(assumedCount == 1 ? "" : "s")} still marked Assumed — confirm or lock Chosen values before finalize.",
            Status = assumedCount == 0
                ? PreFinalizeChecklistItemStatus.Clear
                : PreFinalizeChecklistItemStatus.Blocking,
            Count = assumedCount,
        };

    private static PreFinalizeChecklistItem BuildSeverityItem(
        string itemId,
        string clearTitle,
        string blockedDetailPrefix,
        int count,
        FindingSeverity severity,
        bool blocking = true)
    {
        if (count == 0)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = itemId,
                Title = clearTitle,
                Detail = $"No active {severity.ToString().ToLowerInvariant()}-severity findings.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        PreFinalizeChecklistItemStatus status = blocking
            ? PreFinalizeChecklistItemStatus.Blocking
            : PreFinalizeChecklistItemStatus.Advisory;

        return new PreFinalizeChecklistItem
        {
            ItemId = itemId,
            Title = clearTitle,
            Detail = $"{blockedDetailPrefix}: {count}.",
            Status = status,
            Count = count,
        };
    }

    private PreFinalizeChecklistItem BuildEvidenceLinkageItem(string runId, IReadOnlyList<Finding> findings)
    {
        FindingEvidenceLinkageFindingEngineOptions options = _findingEvidenceLinkageFindingEngineOptions.Value;

        if (!options.Enabled)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "evidence-linkage-gaps",
                Title = "Finding evidence linkage",
                Detail = "Evidence linkage validation is disabled for this environment.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        int linkageGapCount = _findingEvidenceLinkageFindingEngine.Evaluate(runId, findings)?.Count ?? 0;

        return new PreFinalizeChecklistItem
        {
            ItemId = "evidence-linkage-gaps",
            Title = "Finding evidence linkage",
            Detail = linkageGapCount == 0
                ? "All high-severity findings have graph, trace, or policy anchors."
                : $"{linkageGapCount} high-severity finding{(linkageGapCount == 1 ? "" : "s")} lack evidence linkage anchors.",
            Status = linkageGapCount == 0
                ? PreFinalizeChecklistItemStatus.Clear
                : PreFinalizeChecklistItemStatus.Advisory,
            Count = linkageGapCount,
        };
    }

    private async Task<PreFinalizeChecklistItem> BuildProvisionalSynthesisItemAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is null || !Guid.TryParse(runId, out Guid parsedRunId))
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "provisional-synthesis",
                Title = "Framing completeness",
                Detail = "Knowledge model not available for this run.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        ArchitectureKnowledgeModel? model = await _knowledgeModelAccess
            .GetForRunAsync(scope, parsedRunId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null || !model.IsProvisionalSynthesis)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "provisional-synthesis",
                Title = "Framing completeness",
                Detail = "Required framing questions are complete for synthesis.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        int unresolvedQuestionCount = model.Elements.Count(element =>
            element.Kind == ArchitectureElementKind.UnresolvedQuestion);

        return new PreFinalizeChecklistItem
        {
            ItemId = "provisional-synthesis",
            Title = "Framing completeness",
            Detail =
                $"{unresolvedQuestionCount} required framing question{(unresolvedQuestionCount == 1 ? "" : "s")} remain unanswered — synthesis is provisional.",
            Status = PreFinalizeChecklistItemStatus.Advisory,
            Count = unresolvedQuestionCount,
        };
    }

    private static PreFinalizeChecklistItem BuildPreCommitGateItem(PreCommitGateResult gateResult)
    {
        if (gateResult.Blocked)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "pre-commit-gate",
                Title = "Pre-finalize governance gate",
                Detail = gateResult.Reason ?? "Policy pack thresholds would block finalize.",
                Status = PreFinalizeChecklistItemStatus.Blocking,
                Count = gateResult.BlockingFindingIds.Count,
            };
        }

        if (gateResult.WarnOnly)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "pre-commit-gate",
                Title = "Pre-finalize governance gate",
                Detail = gateResult.Warnings.Count > 0
                    ? string.Join(" ", gateResult.Warnings)
                    : "Findings meet the threshold but severities are warn-only.",
                Status = PreFinalizeChecklistItemStatus.Advisory,
                Count = gateResult.Warnings.Count,
            };
        }

        return new PreFinalizeChecklistItem
        {
            ItemId = "pre-commit-gate",
            Title = "Pre-finalize governance gate",
            Detail = "No enforcing policy-pack block applies to this run.",
            Status = PreFinalizeChecklistItemStatus.Clear,
            Count = 0,
        };
    }
}
