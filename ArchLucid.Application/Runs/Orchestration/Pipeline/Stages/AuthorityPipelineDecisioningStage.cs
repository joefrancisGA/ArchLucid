using System.Text.Json;

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <inheritdoc cref="IAuthorityPipelineDecisioningStage" />
public sealed class AuthorityPipelineDecisioningStage(
    IDecisionEngine decisionEngine,
    IAuthorityPipelineStagePersistence stagePersistence,
    IAuditService auditService,
    IAuthorityClosedLoopStrengtheningPass closedLoopStrengtheningPass,
    IOptionsMonitor<AuthorityPipelineOptions> authorityPipelineOptions,
    ILogger<AuthorityPipelineDecisioningStage> logger) : IAuthorityPipelineDecisioningStage
{
    private readonly IDecisionEngine _decisionEngine =
        decisionEngine ?? throw new ArgumentNullException(nameof(decisionEngine));

    private readonly IAuthorityPipelineStagePersistence _stagePersistence =
        stagePersistence ?? throw new ArgumentNullException(nameof(stagePersistence));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAuthorityClosedLoopStrengtheningPass _closedLoopStrengtheningPass =
        closedLoopStrengtheningPass ?? throw new ArgumentNullException(nameof(closedLoopStrengtheningPass));

    private readonly IOptionsMonitor<AuthorityPipelineOptions> _authorityPipelineOptions =
        authorityPipelineOptions ?? throw new ArgumentNullException(nameof(authorityPipelineOptions));

    private readonly ILogger<AuthorityPipelineDecisioningStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        RunRecord run = context.Run;
        ScopeContext scope = context.Scope;

        EnforceFindingsReadyForDecisioning(context.FindingsSnapshot!, run.RunId);

        (ManifestDocument manifest, DecisionTraceDto trace) = await _decisionEngine.DecideAsync(
            run.RunId,
            context.ContextSnapshot!.SnapshotId,
            context.GraphSnapshot!,
            context.FindingsSnapshot!,
            cancellationToken);

        ApplyScope(trace, scope);
        ApplyScope(manifest, scope);

        await _stagePersistence.SaveTraceAsync(trace, context.UnitOfWork, cancellationToken);
        await _stagePersistence.SaveManifestAsync(manifest, context.UnitOfWork, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ManifestGenerated,
                RunId = run.RunId,
                ManifestId = manifest.ManifestId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        manifest.ManifestHash,
                        manifest.RuleSetId
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            context.UnitOfWork,
            cancellationToken);

        context.Manifest = manifest;
        context.Trace = trace;

        await _closedLoopStrengtheningPass.TryStrengthenManifestAsync(
            scope,
            run,
            context.Request,
            manifest,
            cancellationToken);

        if (trace is not RuleAuditTraceDto)
            throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");
    }

    internal void EnforceFindingsReadyForDecisioning(FindingsSnapshot snapshot, Guid runId)
    {
        if (snapshot is null)
            throw new ArgumentNullException(nameof(snapshot));

        AuthorityPipelineOptions opts = _authorityPipelineOptions.CurrentValue;

        if (snapshot.GenerationStatus == FindingsSnapshotGenerationStatus.Failed)
            throw new InvalidOperationException(
                $"Findings snapshot generation failed for all engines (RunId={runId:D}); aborting authority decisioning.");

        if (snapshot.GenerationStatus == FindingsSnapshotGenerationStatus.PartiallyComplete)
        {
            bool blocking = FindingEngineFailureCommitClassifier.HasCommitBlockingFailures(snapshot.EngineFailures);

            if (blocking || opts.HaltOnPartialFindings)
                throw new InvalidOperationException(
                    $"Findings snapshot is only partially complete (RunId={runId:D}); authority pipeline halts before decisioning when a safety-critical engine failed or AuthorityPipeline:HaltOnPartialFindings is true.");

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Authority pipeline continuing decisioning with degraded finding coverage: RunId={RunId}, FailedEngineCount={FailedEngineCount}",
                    runId,
                    snapshot.EngineFailures.Count);
            }
        }
    }

    private static void ApplyScope(DecisionTraceDto trace, ScopeContext scope)
    {
        if (trace is not RuleAuditTraceDto ruleAuditTrace)
            throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

        RuleAuditTracePayload audit = ruleAuditTrace.RuleAudit;
        audit.TenantId = scope.TenantId;
        audit.WorkspaceId = scope.WorkspaceId;
        audit.ProjectId = scope.ProjectId;
    }

    private static void ApplyScope(ManifestDocument manifest, ScopeContext scope)
    {
        manifest.TenantId = scope.TenantId;
        manifest.WorkspaceId = scope.WorkspaceId;
        manifest.ProjectId = scope.ProjectId;
    }
}
