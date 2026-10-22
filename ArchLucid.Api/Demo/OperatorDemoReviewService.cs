using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Demo;

/// <summary>
///     Orchestrates operator one-click demo review: seed default policy packs, create → forced-simulator execute → commit
///     under the current tenant scope.
/// </summary>
public sealed class OperatorDemoReviewService(
    IArchitectureRunCreateOrchestrator architectureRunCreateOrchestrator,
    [FromKeyedServices(ArchitectureRunExecuteOrchestrationKeys.QuickStartForcedSimulator)]
    IArchitectureRunExecuteOrchestrator quickStartExecuteOrchestrator,
    IArchitectureRunCommitOrchestrator architectureRunCommitOrchestrator,
    IDefaultPolicyPackSeeder defaultPolicyPackSeeder,
    IAuditService auditService,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    ILogger<OperatorDemoReviewService> logger)
{
    private readonly IActorContext
        _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IArchitectureRunCommitOrchestrator _architectureRunCommitOrchestrator =
        architectureRunCommitOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCommitOrchestrator));

    private readonly IArchitectureRunCreateOrchestrator _architectureRunCreateOrchestrator =
        architectureRunCreateOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCreateOrchestrator));

    private readonly IAuditService
        _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IDefaultPolicyPackSeeder _defaultPolicyPackSeeder =
        defaultPolicyPackSeeder ?? throw new ArgumentNullException(nameof(defaultPolicyPackSeeder));

    private readonly ILogger<OperatorDemoReviewService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IArchitectureRunExecuteOrchestrator _quickStartExecuteOrchestrator =
        quickStartExecuteOrchestrator ?? throw new ArgumentNullException(nameof(quickStartExecuteOrchestrator));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<OperatorDemoReviewResponse> RunAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await _defaultPolicyPackSeeder
            .EnsureDefaultPolicyPacksAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        ArchitectureRequest architectureRequest = BuildArchitectureRequest();
        string actor = _actorContext.GetActor();

        CreateRunResult created =
            await _architectureRunCreateOrchestrator
                .CreateRunAsync(architectureRequest, null, cancellationToken)
                .ConfigureAwait(false);

        string runId = created.Run.RunId;

        ExecuteRunResult executed =
            await _quickStartExecuteOrchestrator.ExecuteRunAsync(runId, cancellationToken)
                .ConfigureAwait(false);

        await LogRunSubmittedAuditAsync(actor, scope, runId, cancellationToken).ConfigureAwait(false);

        CommitRunResult committed =
            await _architectureRunCommitOrchestrator.CommitRunAsync(runId, cancellationToken).ConfigureAwait(false);

        await LogDemoReviewCompletedAuditAsync(actor, scope, runId, cancellationToken).ConfigureAwait(false);

        string manifestVersion = committed.Manifest.Metadata.ManifestVersion;
        string runDetailUrl = $"/reviews/{Uri.EscapeDataString(runId)}";

        if (_logger.IsEnabled(LogLevel.Information))

            _logger.LogInformation(
                "Operator demo review completed RunId={RunId} ManifestVersion={ManifestVersion} PolicyPack={PolicyPack}",
                runId,
                manifestVersion,
                OperatorDemoReviewPresets.HighlightPolicyPackDisplayName);

        return new OperatorDemoReviewResponse
        {
            RunId = runId,
            ManifestId = manifestVersion,
            PolicyPackName = OperatorDemoReviewPresets.HighlightPolicyPackDisplayName,
            TopFindings = SelectTopFindingSummaries(executed.Results, 5),
            RunDetailUrl = runDetailUrl
        };
    }

    private static ArchitectureRequest BuildArchitectureRequest()
    {
        return new ArchitectureRequest
        {
            RequestId = $"demo-review-{Guid.NewGuid():N}",
            Description = OperatorDemoReviewPresets.ArchitectureDescription,
            SystemName = OperatorDemoReviewPresets.SystemDisplayName,
            Environment = "sandbox",
            CloudProvider = CloudProvider.Azure,
            TopologyHints =
            [
                "Public App Service ingress without WAF",
                "Storage account with anonymous blob container",
                "SQL with public network path"
            ],
            SecurityBaselineHints =
            [
                "Storage account keys in configuration",
                "No private endpoints",
                "Diagnostics disabled"
            ],
            RequiredCapabilities = OperatorDemoReviewPresets.RequiredCapabilities.ToList(),
            Constraints = OperatorDemoReviewPresets.Constraints.ToList()
        };
    }

    private static List<OperatorDemoReviewFindingSummary> SelectTopFindingSummaries(
        IReadOnlyList<AgentResult> results,
        int limit)
    {
        IEnumerable<ArchitectureFinding> ordered =
            results.SelectMany(static r => r.Findings).OrderByDescending(static f => f.Severity);

        List<OperatorDemoReviewFindingSummary> picked = [];

        foreach (ArchitectureFinding finding in ordered)
        {
            if (picked.Count >= limit)
                break;

            picked.Add(new OperatorDemoReviewFindingSummary
            {
                Title = DisplayTitle(finding),
                Severity = finding.Severity.ToString(),
                PolicyRuleKey = TryReadPolicyRuleKey(finding)
            });
        }

        return picked;
    }

    private static string DisplayTitle(ArchitectureFinding finding)
    {
        if (!string.IsNullOrWhiteSpace(finding.Message))
            return finding.Message.Trim();

        return string.IsNullOrWhiteSpace(finding.Category) ? "Finding" : finding.Category.Trim();
    }

    private static string? TryReadPolicyRuleKey(ArchitectureFinding finding)
    {
        if (string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            return null;

        return finding.PolicyRuleId.Trim();
    }

    private async Task LogRunSubmittedAuditAsync(
        string actor,
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        Guid? runGuid = TryParseRunGuidForAudit(runId);

        AuditEvent runSubmitted = new()
        {
            EventType = AuditEventTypes.RunSubmitted,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runGuid
        };

        await DurableAuditLogRetry.TryLogAsync(
                ct => _auditService.LogAsync(runSubmitted, ct),
                _logger,
                $"{AuditEventTypes.RunSubmitted}:{LogSanitizer.Sanitize(runId)}",
                cancellationToken,
                auditEventTypeForMetrics: AuditEventTypes.RunSubmitted)
            .ConfigureAwait(false);
    }

    private async Task LogDemoReviewCompletedAuditAsync(
        string actor,
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        Guid? runGuid = TryParseRunGuidForAudit(runId);

        AuditEvent demoReviewCompleted = new()
        {
            EventType = AuditEventTypes.RunCompleted,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runGuid,
            DataJson = JsonSerializer.Serialize(
                new
                {
                    runId,
                    source = "operator-demo-review",
                    policyPack = OperatorDemoReviewPresets.HighlightPolicyPackDisplayName
                },
                AuditJsonSerializationOptions.Instance)
        };

        await DurableAuditLogRetry.TryLogAsync(
                ct => _auditService.LogAsync(demoReviewCompleted, ct),
                _logger,
                $"{AuditEventTypes.RunCompleted}:{LogSanitizer.Sanitize(runId)}",
                cancellationToken,
                auditEventTypeForMetrics: AuditEventTypes.RunCompleted)
            .ConfigureAwait(false);
    }

    private static Guid? TryParseRunGuidForAudit(string runId)
    {
        if (Guid.TryParseExact(runId, "N", out Guid parsed))
            return parsed;

        return Guid.TryParse(runId, out parsed) ? parsed : null;
    }
}
