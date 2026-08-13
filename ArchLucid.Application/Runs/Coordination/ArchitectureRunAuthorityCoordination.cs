using ArchLucid.Application.Agents;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Coordination;

/// <summary>
///     Validates <see cref = "ArchitectureRequest"/> input, delegates persistence to
///     <see cref = "IAuthorityRunOrchestrator"/>, and assembles <see cref = "CoordinationResult"/> (run, evidence bundle,
///     starter tasks).
/// </summary>
public sealed class ArchitectureRunAuthorityCoordination(
    IAuthorityRunOrchestrator authorityRunOrchestrator,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    ITechnologyLedgerRepository technologyLedgerRepository,
    TechnologyLedgerRequestSeeder technologyLedgerRequestSeeder,
    TechnologyLedgerEvidenceSeeder technologyLedgerEvidenceSeeder,
    IRunStateTransitionService runStateTransitionService,
    IModelExecutionProfileResolver modelExecutionProfileResolver,
    IReviewModelAliasResolver reviewModelAliasResolver,
    IAgentModelAliasRegistry agentModelAliasRegistry,
    IAuditService auditService,
    ILogger<ArchitectureRunAuthorityCoordination> logger) : IArchitectureRunAuthorityCoordination
{
    private readonly IAuthorityRunOrchestrator _authorityRunOrchestrator =
        authorityRunOrchestrator ?? throw new ArgumentNullException(nameof(authorityRunOrchestrator));

    private readonly IAzureExtractorPackageRepository _azureExtractorPackageRepository =
        azureExtractorPackageRepository ?? throw new ArgumentNullException(nameof(azureExtractorPackageRepository));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly TechnologyLedgerRequestSeeder _technologyLedgerRequestSeeder =
        technologyLedgerRequestSeeder ?? throw new ArgumentNullException(nameof(technologyLedgerRequestSeeder));

    private readonly TechnologyLedgerEvidenceSeeder _technologyLedgerEvidenceSeeder =
        technologyLedgerEvidenceSeeder ?? throw new ArgumentNullException(nameof(technologyLedgerEvidenceSeeder));

    private readonly ILogger<ArchitectureRunAuthorityCoordination> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IModelExecutionProfileResolver _modelExecutionProfileResolver =
        modelExecutionProfileResolver ?? throw new ArgumentNullException(nameof(modelExecutionProfileResolver));

    private readonly IReviewModelAliasResolver _reviewModelAliasResolver =
        reviewModelAliasResolver ?? throw new ArgumentNullException(nameof(reviewModelAliasResolver));

    private readonly IAgentModelAliasRegistry _agentModelAliasRegistry =
        agentModelAliasRegistry ?? throw new ArgumentNullException(nameof(agentModelAliasRegistry));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc/>
    public async Task<CoordinationResult> CreateRunAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken = default,
        IArchLucidUnitOfWork? enlistUnitOfWork = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        CoordinationResult output = new();
        List<string> validationErrors = ValidateRequest(request);
        if (validationErrors.Count > 0)
        {
            output.Errors.AddRange(validationErrors);
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarningWithThreeSanitizedUserStrings(
                    "Coordination rejected (validation): RequestId={RequestId}, SystemName={SystemName}, Errors={Errors}", request.RequestId,
                    request.SystemName, string.Join("; ", validationErrors));
            return output;
        }

        EvidenceBundle evidenceBundle = RunStarterTaskFactory.BuildEvidenceBundle(request);
        RunRecord authorityRun = await _authorityRunOrchestrator.ExecuteAsync(
            ContextIngestionRequestMapper.FromArchitectureRequest(request),
            cancellationToken,
            evidenceBundle.EvidenceBundleId,
            enlistUnitOfWork);
        ScopeContext scopeForExtractor = _scopeContextProvider.GetCurrentScope();
        AzureExtractorPackageProvenance? extractorProvenance =
            await _azureExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(scopeForExtractor, authorityRun.RunId, cancellationToken);
        if (extractorProvenance is not null)
            AzureExtractorEvidenceBundleMerger.Merge(evidenceBundle, extractorProvenance);
        bool deferred = authorityRun.ContextSnapshotId is null;
        string runId = authorityRun.RunId.ToString("N");
        ArchitectureRun run = BuildRunFromAuthority(authorityRun, request, deferred);
        List<AgentTask> tasks = [];

        if (!deferred)
        {
            await TechnologyLedgerRunCreateSeeding.TrySeedIntakeAsync(
                runId,
                request,
                _technologyLedgerRequestSeeder,
                _technologyLedgerEvidenceSeeder,
                _logger,
                cancellationToken);

            IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
                await _technologyLedgerRepository.GetByRunIdAsync(scopeForExtractor, runId, cancellationToken);

            ModelExecutionProfileResolution profileResolution =
                await _modelExecutionProfileResolver.ResolveForRunCreateAsync(request, cancellationToken).ConfigureAwait(false);

            ReviewModelAliasResolution aliasResolution =
                await _reviewModelAliasResolver.ResolveForRunCreateAsync(request, cancellationToken).ConfigureAwait(false);

            request.EffectiveModelAliasId = aliasResolution.EffectiveAliasId;

            tasks = RunStarterTaskFactory.BuildStarterTasks(
                runId,
                evidenceBundle,
                request,
                ledgerEntries,
                profileResolution.EffectiveProfile);

            if (!string.IsNullOrWhiteSpace(profileResolution.RequestedOverrideRaw))
            {
                await ModelExecutionProfileOverrideAuditWriter.TryLogOverrideAppliedAsync(
                    _auditService,
                    _scopeContextProvider,
                    runId,
                    profileResolution,
                    cancellationToken).ConfigureAwait(false);
            }

            if (!string.IsNullOrWhiteSpace(aliasResolution.RequestedOverrideRaw))
            {
                await ReviewModelAliasOverrideAuditWriter.TryLogOverrideAppliedAsync(
                    _auditService,
                    _scopeContextProvider,
                    runId,
                    aliasResolution,
                    cancellationToken).ConfigureAwait(false);
            }
        }

        run.TaskIds = [..tasks.Select(t => t.TaskId)];
        output.Run = run;
        output.EvidenceBundle = evidenceBundle;
        output.Tasks = tasks;

        if (enlistUnitOfWork is null)
        {
            await PatchAuthorityRunHeaderAsync(
                authorityRun.RunId,
                request,
                deferred,
                request.EffectiveModelAliasId,
                cancellationToken);
        }
        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation(
                "Coordination completed: RunId={RunId}, RequestId={RequestId}, StarterTaskCount={TaskCount}, EvidenceBundleId={EvidenceBundleId}, Deferred={Deferred}",
                LogSanitizer.Sanitize(run.RunId),
                LogSanitizer.Sanitize(request.RequestId),
                tasks.Count,
                LogSanitizer.Sanitize(evidenceBundle.EvidenceBundleId),
                deferred);
        return output;
    }

    private async Task PatchAuthorityRunHeaderAsync(
        Guid authorityRunId,
        ArchitectureRequest request,
        bool deferred,
        string? effectiveModelAliasId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, authorityRunId, cancellationToken);
        if (header is null)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Authority run header {RunId} not found for lifecycle patch (RequestId={RequestId}).", authorityRunId,
                    LogSanitizer.Sanitize(request.RequestId));
            return;
        }

        header.ArchitectureRequestId = request.RequestId;
        string targetLegacyRunStatus = _runStateTransitionService.GetCoordinationLegacyStatusAfterCreate(deferred);

        if (_runStateTransitionService.ShouldApplyCoordinationLegacyStatusPatch(header.LegacyRunStatus, targetLegacyRunStatus))
            header.LegacyRunStatus = targetLegacyRunStatus;

        header.PackageOrigin = ArchitecturePackageOriginResolver.Resolve(request);

        if (!deferred
            && !string.IsNullOrWhiteSpace(effectiveModelAliasId)
            && _agentModelAliasRegistry.TryGet(effectiveModelAliasId, out AgentModelAliasRegistryEntry? aliasEntry)
            && aliasEntry is not null)
        {
            ReviewRunEngineProvenance selectionProvenance = ReviewRunEngineSelectionProvenanceBuilder.Build(
                effectiveModelAliasId,
                aliasEntry,
                header.CreatedUtc);

            header.EngineProvenanceJson = ReviewRunEngineProvenanceJson.Serialize(selectionProvenance);
        }

        await _runRepository.UpdateAsync(header, cancellationToken);
    }

    private static List<string> ValidateRequest(ArchitectureRequest request)
    {
        List<string> errors = [];
        if (string.IsNullOrWhiteSpace(request.RequestId))
            errors.Add("RequestId is required.");
        if (string.IsNullOrWhiteSpace(request.SystemName))
            errors.Add("SystemName is required.");
        if (string.IsNullOrWhiteSpace(request.Description))
            errors.Add("Description is required.");
        return errors;
    }

    private static ArchitectureRun BuildRunFromAuthority(RunRecord authorityRun, ArchitectureRequest request, bool deferred)
    {
        return new ArchitectureRun
        {
            RunId = authorityRun.RunId.ToString("N"),
            RequestId = request.RequestId,
            Status = deferred ? ArchitectureRunStatus.Created : ArchitectureRunStatus.TasksGenerated,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CompletedUtc = null,
            CurrentManifestVersion = null,
            ContextSnapshotId = authorityRun.ContextSnapshotId?.ToString("N"),
            GraphSnapshotId = authorityRun.GraphSnapshotId,
            FindingsSnapshotId = authorityRun.FindingsSnapshotId,
            GoldenManifestId = authorityRun.GoldenManifestId,
            DecisionTraceId = authorityRun.DecisionTraceId,
            ArtifactBundleId = authorityRun.ArtifactBundleId,
            StructuralExecutionMode = authorityRun.StructuralExecutionMode,
            TaskIds = []
        };
    }
}
