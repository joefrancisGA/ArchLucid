using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs;

/// <summary>Builds unified run decision explainability from hydrated run detail and coordinator nodes (TB-054).</summary>
public static class RunDecisionExplainabilityBuilder
{
    private const string AuthorityPipeline = "authority";
    private const string CoordinatorPipeline = "coordinator_v2";

    public static RunDecisionExplainabilityDto Build(
        RunDetailDto detail,
        IReadOnlyList<DecisionNodeRecord> coordinatorNodes)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(coordinatorNodes);

        return new RunDecisionExplainabilityDto
        {
            SnapshotIds = BuildSnapshotIds(detail),
            AuthorityRuleAudit = BuildAuthoritySection(detail),
            ManifestDecisions = BuildManifestDecisions(detail),
            CoordinatorDecisionNodes = BuildCoordinatorNodes(coordinatorNodes),
        };
    }

    private static RunDecisionExplainabilitySnapshotIds BuildSnapshotIds(RunDetailDto detail)
    {
        ManifestDocument? manifest = detail.GoldenManifest;
        RunRecord run = detail.Run;
        RuleAuditTracePayload? audit = TryReadAuthorityAudit(detail);

        return new RunDecisionExplainabilitySnapshotIds
        {
            ContextSnapshotId = manifest?.ContextSnapshotId
                ?? run.ContextSnapshotId
                ?? audit?.ContextSnapshotId,
            GraphSnapshotId = manifest?.GraphSnapshotId
                ?? run.GraphSnapshotId
                ?? audit?.GraphSnapshotId,
            FindingsSnapshotId = manifest?.FindingsSnapshotId
                ?? run.FindingsSnapshotId
                ?? audit?.FindingsSnapshotId,
        };
    }

    private static RunAuthorityRuleAuditExplainabilitySection? BuildAuthoritySection(RunDetailDto detail)
    {
        RuleAuditTracePayload? audit = TryReadAuthorityAudit(detail);

        if (audit is null)
            return null;

        return new RunAuthorityRuleAuditExplainabilitySection
        {
            Pipeline = AuthorityPipeline,
            DecisionTraceId = audit.DecisionTraceId,
            RuleSetId = audit.RuleSetId,
            RuleSetVersion = audit.RuleSetVersion,
            AppliedRuleIds = audit.AppliedRuleIds,
            AcceptedFindingIds = audit.AcceptedFindingIds,
            RejectedFindingIds = audit.RejectedFindingIds,
            Notes = audit.Notes,
            PromptRefs = audit.PromptRefs,
        };
    }

    private static IReadOnlyList<RunManifestDecisionExplainabilityRow> BuildManifestDecisions(RunDetailDto detail)
    {
        ManifestDocument? manifest = detail.GoldenManifest;

        if (manifest?.Decisions is null || manifest.Decisions.Count == 0)
            return [];

        return manifest.Decisions
            .Select(decision => new RunManifestDecisionExplainabilityRow
            {
                Pipeline = AuthorityPipeline,
                DecisionId = decision.DecisionId,
                Category = decision.Category,
                Title = decision.Title,
                SelectedOption = decision.SelectedOption,
                Rationale = decision.Rationale,
                Confidence = decision.Confidence,
                ConfidenceSource = decision.ConfidenceSource.ToString(),
                BuyerConfidenceSource = decision.BuyerConfidenceSource,
                SupportingFindingIds = decision.SupportingFindingIds,
            })
            .ToList();
    }

    private static IReadOnlyList<RunCoordinatorDecisionNodeExplainabilityRow> BuildCoordinatorNodes(
        IReadOnlyList<DecisionNodeRecord> coordinatorNodes)
    {
        if (coordinatorNodes.Count == 0)
            return [];

        return coordinatorNodes
            .Select(node => new RunCoordinatorDecisionNodeExplainabilityRow
            {
                Pipeline = CoordinatorPipeline,
                DecisionId = node.DecisionId,
                Topic = node.Topic,
                SelectedOptionId = node.SelectedOptionId,
                Rationale = node.Rationale,
                Confidence = node.Confidence,
                SupportingEvaluationIds = node.SupportingEvaluationIds,
                OpposingEvaluationIds = node.OpposingEvaluationIds,
            })
            .ToList();
    }

    private static RuleAuditTracePayload? TryReadAuthorityAudit(RunDetailDto detail)
    {
        if (detail.AuthorityTrace is not RuleAuditTraceDto ruleAuditTrace)
            return null;

        return ruleAuditTrace.RuleAudit;
    }
}
