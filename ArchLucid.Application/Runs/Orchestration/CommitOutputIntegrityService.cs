using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref="ICommitOutputIntegrityService" />
public sealed class CommitOutputIntegrityService(
    IScopeContextProvider scopeContextProvider,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IAgentOutputQualityGateOptionsResolver qualityGateOptionsResolver,
    IRunRepository runRepository,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IRunPolicyPackPinService runPolicyPackPinService,
    IRunEvidencePackagePinService runEvidencePackagePinService,
    IArchitectureKnowledgeModelAccess architectureKnowledgeModelAccess,
    IDraftRequestRepository draftRequestRepository,
    IArchitectureVersionRepository architectureVersionRepository) : ICommitOutputIntegrityService
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IAgentOutputQualityGateOptionsResolver _qualityGateOptionsResolver =
        qualityGateOptionsResolver ?? throw new ArgumentNullException(nameof(qualityGateOptionsResolver));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IRunPolicyPackPinService _runPolicyPackPinService =
        runPolicyPackPinService ?? throw new ArgumentNullException(nameof(runPolicyPackPinService));

    private readonly IRunEvidencePackagePinService _runEvidencePackagePinService =
        runEvidencePackagePinService ?? throw new ArgumentNullException(nameof(runEvidencePackagePinService));

    private readonly IArchitectureKnowledgeModelAccess _architectureKnowledgeModelAccess =
        architectureKnowledgeModelAccess ?? throw new ArgumentNullException(nameof(architectureKnowledgeModelAccess));

    private readonly IDraftRequestRepository _draftRequestRepository =
        draftRequestRepository ?? throw new ArgumentNullException(nameof(draftRequestRepository));

    private readonly IArchitectureVersionRepository _architectureVersionRepository =
        architectureVersionRepository ?? throw new ArgumentNullException(nameof(architectureVersionRepository));

    /// <inheritdoc />
    public async Task EnsurePassOrThrowAsync(
        ArchitectureRun run,
        string runId,
        FindingsSnapshot findings,
        ArchitectureRequest architectureRequest,
        IReadOnlyList<string>? acknowledgedAssumptionIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(architectureRequest);

        IReadOnlyList<string> structuralModeReasons =
            StructuralExecutionModeCommitGuard.GetBlockingReasons(run.StructuralExecutionMode);

        if (structuralModeReasons.Count > 0)
        {
            throw new ConflictException(
                "Commit blocked: structural execution mode is not decision-grade. "
                + string.Join(" ", structuralModeReasons));
        }

        if (Guid.TryParseExact(runId, "N", out Guid runGuid) || Guid.TryParse(runId, out runGuid))
        {
            IReadOnlyList<StageTimelineSummary> stageOutcomes =
                await _runStageOutcomesRepository.ListByRunIdAsync(runGuid, cancellationToken).ConfigureAwait(false);

            AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseResolver.Resolve(
                run.GoldenManifestId,
                null,
                stageOutcomes);

            if (phase != AuthorityRunLifecyclePhase.Complete)
            {
                throw new ConflictException(
                    $"Commit blocked: authority lifecycle phase is {phase}; pipeline must be Complete before seal.");
            }
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentExecutionTrace> traces =
            await _agentExecutionTraceRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        await EnsureArchitectureVersionPinnedOrThrowAsync(scope, runId, architectureRequest, cancellationToken)
            .ConfigureAwait(false);
        await EnsureCreateTimePinsUnchangedOrThrowAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        AgentOutputQualityGateOptions gateOptions = _qualityGateOptionsResolver.Resolve(cancellationToken);
        IReadOnlyList<string> qualityReasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, gateOptions, traces);

        if (qualityReasons.Count > 0)
        {
            throw new ConflictException(
                "Commit blocked: agent output quality gate rejected one or more traces. "
                + string.Join(" ", qualityReasons));
        }

        IReadOnlyList<string> provenanceViolations = DecisionGradeFindingProvenanceValidator.GetViolations(findings);

        if (provenanceViolations.Count > 0)
        {
            throw new ConflictException(
                "Commit blocked: one or more findings lack decision-grade provenance. "
                + string.Join(" ", provenanceViolations));
        }

        HashSet<string>? acknowledgedIds = acknowledgedAssumptionIds is null
            ? null
            : new HashSet<string>(acknowledgedAssumptionIds, StringComparer.Ordinal);

        IReadOnlyList<string> assumptionGateReasons =
            FinalizeAssumptionGateEvaluator.GetBlockingReasons(architectureRequest, findings, acknowledgedIds);

        if (assumptionGateReasons.Count > 0)
        {
            throw new ConflictException(
                "Commit blocked: existential assumptions require confirmation before finalize. "
                + string.Join(" ", assumptionGateReasons));
        }
    }

    private async Task EnsureArchitectureVersionPinnedOrThrowAsync(
        ScopeContext scope,
        string runId,
        ArchitectureRequest architectureRequest,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(architectureRequest);
        if (!Guid.TryParseExact(runId, "N", out Guid runGuid) && !Guid.TryParse(runId, out runGuid))
        {
            throw new ConflictException(
                "Commit blocked: run id is invalid for architecture version pin verification.");
        }

        Persistence.Models.RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (header?.ArchitectureVersionId is not Guid versionId || versionId == Guid.Empty)
        {
            throw new ConflictException(
                "Commit blocked: run is missing a pinned ArchitectureVersionId.");
        }

        ArchitectureVersionRecord? version = await _architectureVersionRepository
            .GetByIdAsync(scope, versionId, cancellationToken)
            .ConfigureAwait(false);

        if (version is null)
        {
            throw new ConflictException(
                "Commit blocked: pinned ArchitectureVersionId was not found.");
        }

        Contracts.ArchitectureIntelligence.ArchitectureKnowledgeModel? knowledgeModel = null;

        if (Guid.TryParseExact(runId, "N", out Guid runGuidForKm) || Guid.TryParse(runId, out runGuidForKm))
        {
            knowledgeModel = await _architectureKnowledgeModelAccess
                .GetForRunAsync(scope, runGuidForKm, cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureVersionContentFingerprintVerifier.EnsurePinnedVersionMatchesRequestOrThrow(
            version,
            architectureRequest,
            knowledgeModel);

        if (header.PinnedArchitectureVersionContentHashSha256 is { Length: > 0 } pinnedHash
            && !version.ContentHashSha256.AsSpan().SequenceEqual(pinnedHash))
        {
            throw new ConflictException(
                "Commit blocked: create-time architecture version content hash (κ) drifted since run create.");
        }
    }

    private async Task EnsureCreateTimePinsUnchangedOrThrowAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParseExact(runId, "N", out Guid runGuid) && !Guid.TryParse(runId, out runGuid))
            return;

        Persistence.Models.RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (header is null)
            return;

        await _runPolicyPackPinService
            .VerifyPinIntegrityOrThrowAsync(header, scope, cancellationToken)
            .ConfigureAwait(false);

        await _runEvidencePackagePinService
            .VerifyPinIntegrityOrThrowAsync(header, scope, cancellationToken)
            .ConfigureAwait(false);

        DraftRequestResponse? draft = await _draftRequestRepository
            .GetBySpawnedRunIdAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId, cancellationToken)
            .ConfigureAwait(false);

        if (draft?.SpawnedDocumentContentHashSha256 is null)
            return;

        byte[] currentHash = DraftDocumentContentFingerprint.Compute(draft.Document);

        if (!DraftDocumentContentFingerprint.SequenceEqual(currentHash, draft.SpawnedDocumentContentHashSha256))
        {
            throw new ConflictException(
                "Commit blocked: draft document content changed after spawn (SpawnedDocumentContentHashSha256 mismatch).");
        }
    }
}
