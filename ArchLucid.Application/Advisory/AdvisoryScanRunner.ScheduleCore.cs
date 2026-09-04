// stryker disable all
using System.Text.Json;

using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Advisory;

public sealed partial class AdvisoryScanRunner
{
    /// <summary>
    ///     Core scan path after ambient scope is pushed: plan generation, governance merge into the plan, alert evaluation,
    ///     digest persistence and delivery.
    /// </summary>
    /// <param name = "schedule">Active schedule row.</param>
    /// <param name = "scope">Same ids as the schedule; used for queries.</param>
    /// <param name = "execution">Execution row updated to completed/failed states by this method and helpers.</param>
    /// <param name = "ct">Cancellation token.</param>
    /// <remarks>
    ///     Copies merged <see cref = "PolicyPackContentDocument.AdvisoryDefaults"/> into
    ///     <see cref = "ImprovementPlan.PolicyPackAdvisoryDefaults"/> before building <see cref = "AlertEvaluationContext"/>.
    /// </remarks>
    private async Task RunScheduleCoreAsync(AdvisoryScanSchedule schedule, ScopeContext scope, AdvisoryScanExecution execution, CancellationToken ct)
    {
        string slug = string.IsNullOrWhiteSpace(schedule.RunProjectSlug) ? "default" : schedule.RunProjectSlug.Trim();
        IReadOnlyList<RunSummaryDto> runs = await authorityQueryService.ListRunsByProjectAsync(scope, slug, 2, ct);
        List<RunSummaryDto> ordered = runs.OrderByDescending(x => x.CreatedUtc).ToList();
        RunSummaryDto? latest = ordered.FirstOrDefault();

        if (latest is null)
        {
            await FailAsync(
                execution,
                schedule,
                AdvisoryScheduleEligibilityGuard.NoFinalizedReviewMessage,
                ct);
            return;
        }

        RunDetailDto? latestDetail = await authorityQueryService.GetRunDetailAsync(scope, latest.RunId, ct);

        if (latestDetail?.GoldenManifest is null)
        {
            await FailAsync(execution, schedule, "Latest run did not contain a golden manifest.", ct);
            return;
        }

        FindingsSnapshot findings = latestDetail.FindingsSnapshot ?? CreateEmptyFindings(latestDetail.GoldenManifest);
        RunSummaryDto? compareTo = ordered.Skip(1).FirstOrDefault();
        ImprovementPlan plan;
        Guid? comparedToRunId = null;
        ComparisonResult? comparisonResult = null;

        if (compareTo is not null)
        {
            RunDetailDto? previousDetail = await authorityQueryService.GetRunDetailAsync(scope, compareTo.RunId, ct);

            if (previousDetail?.GoldenManifest is not null)
            {
                comparisonResult = comparisonService.Compare(previousDetail.GoldenManifest, latestDetail.GoldenManifest);
                comparedToRunId = compareTo.RunId;
                plan = await improvementAdvisorService.GeneratePlanAsync(latestDetail.GoldenManifest, findings, comparisonResult, ct);
            }
            else
                plan = await improvementAdvisorService.GeneratePlanAsync(latestDetail.GoldenManifest, findings, ct);
        }
        else
            plan = await improvementAdvisorService.GeneratePlanAsync(latestDetail.GoldenManifest, findings, ct);

        IReadOnlyList<RecommendationRecord> recommendationRecords =
            await recommendationRepository.ListByRunAsync(schedule.TenantId, schedule.WorkspaceId, schedule.ProjectId, latest.RunId, ct);
        RecommendationLearningProfile? learningProfile =
            await recommendationLearningService.GetLatestProfileAsync(schedule.TenantId, schedule.WorkspaceId, schedule.ProjectId, ct);
        PolicyPackContentDocument effectiveGovernance =
            await effectiveGovernanceLoader.LoadEffectiveContentAsync(schedule.TenantId, schedule.WorkspaceId, schedule.ProjectId, ct);

        foreach (KeyValuePair<string, string> kvp in effectiveGovernance.AdvisoryDefaults)
            plan.PolicyPackAdvisoryDefaults[kvp.Key] = kvp.Value;
        AlertEvaluationContext alertContext = AlertEvaluationContextFactory.ForAdvisoryScan(schedule.TenantId, schedule.WorkspaceId, schedule.ProjectId,
            latest.RunId, comparedToRunId, plan, comparisonResult, recommendationRecords, learningProfile, effectiveGovernance);
        AlertEvaluationOutcome alertOutcome = await alertService.EvaluateAndPersistAsync(alertContext, ct);
        CompositeAlertEvaluationResult compositeOutcome = await compositeAlertService.EvaluateAndPersistAsync(alertContext, ct);
        List<AlertRecord> digestAlerts = alertOutcome.Evaluated.Concat(compositeOutcome.Created).ToList();
        string? decisionNeededMarkdown = await governanceDigestDecisionNeededComposer.BuildDecisionNeededMarkdownAsync(
            schedule.TenantId,
            schedule.WorkspaceId,
            schedule.ProjectId,
            ct);
        ArchitectureDigest digest = digestBuilder.Build(
            schedule.TenantId,
            schedule.WorkspaceId,
            schedule.ProjectId,
            latest.RunId,
            comparedToRunId,
            plan,
            digestAlerts,
            decisionNeededMarkdown,
            latestDetail.GoldenManifest.ManifestHash);
        await digestRepository.CreateAsync(digest, ct);
        await deliveryDispatcher.DeliverAsync(digest, ct);
        TraceCompletenessSummary traceCompletenessSummary = ExplainabilityTraceCompletenessAnalyzer.AnalyzeSnapshot(findings);
        ArchLucidInstrumentation.ExplainabilityTraceCompleteness.Record(traceCompletenessSummary.OverallCompletenessRatio,
            new KeyValuePair<string, object?>("scan_type", "advisory"));
        execution.Status = StatusCompleted;
        execution.CompletedUtc = TimeProvider.System.UtcNowDateTime();
        execution.ResultJson = JsonSerializer.Serialize(
            new
            {
                schemaVersion = 1,
                runId = latest.RunId,
                comparedToRunId,
                recommendationCount = plan.Recommendations.Count,
                digestId = digest.DigestId,
                alertsEvaluated = alertOutcome.Evaluated.Count,
                alertsNewlyPersisted = alertOutcome.NewlyPersisted.Count,
                compositeAlertsCreated = compositeOutcome.Created.Count,
                compositeAlertsSuppressed = compositeOutcome.SuppressedMatchCount,
                traceCompleteness = new
                {
                    totalFindings = traceCompletenessSummary.TotalFindings,
                    overallCompletenessRatio = traceCompletenessSummary.OverallCompletenessRatio,
                    byEngine = traceCompletenessSummary.ByEngine.Select(e => new
                    {
                        engineType = e.EngineType,
                        findingCount = e.FindingCount,
                        completenessRatio = e.CompletenessRatio,
                        graphNodeIdsPopulatedCount = e.GraphNodeIdsPopulatedCount,
                        rulesAppliedPopulatedCount = e.RulesAppliedPopulatedCount,
                        decisionsTakenPopulatedCount = e.DecisionsTakenPopulatedCount,
                        alternativePathsPopulatedCount = e.AlternativePathsPopulatedCount,
                        notesPopulatedCount = e.NotesPopulatedCount
                    }).ToList()
                }
            }, AuditJsonSerializationOptions.Instance);
        await executionRepository.UpdateAsync(execution, ct);
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AdvisoryScanExecuted,
                RunId = latest.RunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    scheduleId = schedule.ScheduleId,
                    executionId = execution.ExecutionId
                },
                    AuditJsonSerializationOptions.Instance)
            }, ct);
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureDigestGenerated,
                RunId = latest.RunId,
                DataJson = JsonSerializer.Serialize(new { digestId = digest.DigestId, scheduleId = schedule.ScheduleId })
            }, ct);
        await TryPublishAdvisoryScanCompletedAsync(
            schedule,
            execution,
            latest.RunId,
            comparedToRunId,
            digest.DigestId,
            true,
            latestDetail.GoldenManifest.ManifestHash,
            ct);
        await AdvanceScheduleAsync(schedule, ct);
    }
}
