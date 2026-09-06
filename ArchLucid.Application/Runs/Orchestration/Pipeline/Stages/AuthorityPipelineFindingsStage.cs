using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <inheritdoc cref="IAuthorityPipelineFindingsStage" />
public sealed class AuthorityPipelineFindingsStage(
    IFindingsOrchestrator findingsOrchestrator,
    IFindingsSnapshotEvaluationConfidenceEnricher findingsSnapshotEvaluationConfidenceEnricher,
    IInsightDensityLlmJudge insightDensityLlmJudge,
    IAuthorityPipelineStagePersistence stagePersistence,
    IAuditService auditService,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<AuthorityPipelineFindingsStage> logger,
    IAgentResultRepository agentResultRepository,
    IArchitectureIntelligenceAuthorityFindingsContributor? authorityFindingsContributor = null,
    IFindingAnalysisContextBuilder? findingAnalysisContextBuilder = null,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null,
    IArchitectureRequestRepository? architectureRequestRepository = null,
    IEvidenceGraphMaterializer? evidenceGraphMaterializer = null,
    TimeProvider? timeProvider = null) : IAuthorityPipelineFindingsStage
{
    private readonly IFindingsOrchestrator _findingsOrchestrator =
        findingsOrchestrator ?? throw new ArgumentNullException(nameof(findingsOrchestrator));

    private readonly IFindingsSnapshotEvaluationConfidenceEnricher _findingsSnapshotEvaluationConfidenceEnricher =
        findingsSnapshotEvaluationConfidenceEnricher ??
        throw new ArgumentNullException(nameof(findingsSnapshotEvaluationConfidenceEnricher));

    private readonly IInsightDensityLlmJudge _insightDensityLlmJudge =
        insightDensityLlmJudge ?? throw new ArgumentNullException(nameof(insightDensityLlmJudge));

    private readonly IAuthorityPipelineStagePersistence _stagePersistence =
        stagePersistence ?? throw new ArgumentNullException(nameof(stagePersistence));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly IOptionsMonitor<PublicSiteOptions> _publicSiteOptions =
        publicSiteOptions ?? throw new ArgumentNullException(nameof(publicSiteOptions));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly ILogger<AuthorityPipelineFindingsStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IArchitectureIntelligenceAuthorityFindingsContributor? _authorityFindingsContributor =
        authorityFindingsContributor;

    private readonly IFindingAnalysisContextBuilder? _findingAnalysisContextBuilder = findingAnalysisContextBuilder;

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    private readonly IArchitectureRequestRepository? _architectureRequestRepository = architectureRequestRepository;

    private readonly IEvidenceGraphMaterializer? _evidenceGraphMaterializer = evidenceGraphMaterializer;

    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    /// <inheritdoc />
    public async Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        RunRecord run = context.Run;
        ScopeContext scope = context.Scope;

        FindingAnalysisContext? analysisContext = await TryBuildFindingAnalysisContextAsync(context, cancellationToken)
            .ConfigureAwait(false);

        _evidenceGraphMaterializer?.Materialize(context.GraphSnapshot!, analysisContext);

        FindingsSnapshot findingsSnapshot = await _findingsOrchestrator.GenerateFindingsSnapshotAsync(
            run.RunId,
            context.ContextSnapshot!.SnapshotId,
            context.GraphSnapshot!,
            cancellationToken,
            analysisContext);

        if (_authorityFindingsContributor is not null)
        {
            IReadOnlyList<Finding> contributedFindings = await _authorityFindingsContributor
                .ContributeAsync(scope, run.RunId.ToString("D"), cancellationToken)
                .ConfigureAwait(false);

            FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
                findingsSnapshot,
                contributedFindings,
                _timeProvider);
        }

        IReadOnlyList<AgentResult> agentResults = await _agentResultRepository
            .GetByRunIdAsync(scope, run.RunId.ToString("D"), cancellationToken)
            .ConfigureAwait(false);

        FindingsSnapshotWithheldMerger.MergeAgentWithheld(findingsSnapshot, agentResults);

        try
        {
            await _findingsSnapshotEvaluationConfidenceEnricher.TryEnrichAsync(findingsSnapshot, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Findings snapshot evaluation confidence enrichment failed for RunId={RunId}; snapshot persisted without enrichment.",
                    run.RunId);
            }
        }

        try
        {
            await _insightDensityLlmJudge.ApplyToFindingsAsync(findingsSnapshot.Findings, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Insight-density engine judge failed for RunId={RunId}; snapshot persisted without judge enrichment.",
                    run.RunId);
            }
        }

        await _stagePersistence.SaveFindingsAsync(findingsSnapshot, context.UnitOfWork, cancellationToken);
        context.FindingsSnapshot = findingsSnapshot;

        RecordFindingsProducedForMetrics(findingsSnapshot);

        run.FindingsSnapshotId = findingsSnapshot.FindingsSnapshotId;
        await _stagePersistence.UpdateRunAsync(run, context.UnitOfWork, cancellationToken);

        if (findingsSnapshot.GenerationStatus == FindingsSnapshotGenerationStatus.Complete)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.FindingsSnapshotSealed,
                    RunId = run.RunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            findingsSnapshotId = findingsSnapshot.FindingsSnapshotId.ToString("D"),
                            findingsSnapshot.SchemaVersion,
                            findingsCount = findingsSnapshot.Findings.Count,
                            generationStatus = findingsSnapshot.GenerationStatus.ToString(),
                        },
                        AuditJsonSerializationOptions.Instance),
                },
                context.UnitOfWork,
                cancellationToken);

            await FindingsIntegrationEventPublishing.TryPublishHighSeverityCapturedAsync(
                _integrationEventOutbox,
                _integrationEventPublisher,
                _integrationEventsOptions,
                _logger,
                findingsSnapshot,
                scope,
                _authorityQueryService,
                _manifestHashService,
                _publicSiteOptions.CurrentValue.BaseUrl,
                context.UnitOfWork.SupportsExternalTransaction ? context.UnitOfWork.Connection : null,
                context.UnitOfWork.SupportsExternalTransaction ? context.UnitOfWork.Transaction : null,
                cancellationToken);
        }
    }

    private static void RecordFindingsProducedForMetrics(FindingsSnapshot snapshot)
    {
        List<Finding> rollupFindings = AuthorityFindingRollupFilter.ForAuthorityRollup(snapshot.Findings);

        if (rollupFindings.Count == 0)
            return;

        foreach (IGrouping<FindingSeverity, Finding> group in rollupFindings.GroupBy(static f => f.Severity))
        {
            TagList tags = new() { { "severity", group.Key.ToString() } };

            ArchLucidInstrumentation.FindingsProducedTotal.Add(group.Count(), tags);
        }
    }

    private async Task<FindingAnalysisContext?> TryBuildFindingAnalysisContextAsync(
        AuthorityPipelineContext context,
        CancellationToken cancellationToken)
    {
        if (_findingAnalysisContextBuilder is null || context.ContextSnapshot is null)
            return null;

        ArchitectureKnowledgeModel? knowledgeModel = null;

        if (_knowledgeModelAccess is not null)
        {
            knowledgeModel = await _knowledgeModelAccess
                .GetForRunAsync(context.Scope, context.Run.RunId, cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureRequest? request = null;

        if (_architectureRequestRepository is not null
            && !string.IsNullOrWhiteSpace(context.Run.ArchitectureRequestId))
        {
            request = await _architectureRequestRepository
                .GetByIdAsync(context.Run.ArchitectureRequestId, cancellationToken)
                .ConfigureAwait(false);
        }

        return await _findingAnalysisContextBuilder
            .BuildAsync(
                context.Scope,
                context.Run.RunId,
                context.ContextSnapshot,
                knowledgeModel,
                request,
                cancellationToken)
            .ConfigureAwait(false);
    }
}
