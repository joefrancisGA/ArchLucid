using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Cm = ArchLucid.Contracts.Manifest;
using DecisionTraceDto = ArchLucid.Contracts.Persistence.DecisionTraces.DecisionTraceDto;
using DomainRuleAuditTracePayload = ArchLucid.Decisioning.DecisionTraces.RuleAuditTracePayload;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <inheritdoc cref="IAuthorityCommitDecisionMaterializationStage" />
public sealed class AuthorityCommitDecisionMaterializationStage(
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IAgentResultRepository agentResultRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ICommitPipelineManifestReuseService commitPipelineManifestReuseService,
    IDecisionEngine decisionEngine,
    IAuthorityCommitProjectionBuilder projectionBuilder,
    ICommitOutputIntegrityService commitOutputIntegrityService,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    IGraphMergeRuntimeInvariantReporter graphMergeRuntimeInvariantReporter) : IAuthorityCommitDecisionMaterializationStage
{
    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ICommitPipelineManifestReuseService _commitPipelineManifestReuseService =
        commitPipelineManifestReuseService ?? throw new ArgumentNullException(nameof(commitPipelineManifestReuseService));

    private readonly IDecisionEngine _decisionEngine =
        decisionEngine ?? throw new ArgumentNullException(nameof(decisionEngine));

    private readonly IAuthorityCommitProjectionBuilder _projectionBuilder =
        projectionBuilder ?? throw new ArgumentNullException(nameof(projectionBuilder));

    private readonly ICommitOutputIntegrityService _commitOutputIntegrityService =
        commitOutputIntegrityService ?? throw new ArgumentNullException(nameof(commitOutputIntegrityService));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IGraphMergeRuntimeInvariantReporter _graphMergeRuntimeInvariantReporter =
        graphMergeRuntimeInvariantReporter ?? throw new ArgumentNullException(nameof(graphMergeRuntimeInvariantReporter));

    /// <inheritdoc />
    public async Task<AuthorityCommitDecisionMaterializationResult> MaterializeAsync(
        ArchitectureRun run,
        Guid runGuid,
        RunRecord runRecord,
        ArchitectureRequest request,
        ScopeContext scope,
        CommitRunRequest? commitOptions,
        CancellationToken cancellationToken)
    {
        string runId = runGuid.ToString("N");

        if (runRecord.ContextSnapshotId is not { } contextSnapshotId || runRecord.GraphSnapshotId is not { } graphId ||
            runRecord.FindingsSnapshotId is not { } findingsId)
            throw new InvalidOperationException(
                $"Run '{runId}' is missing architecture run pipeline snapshot ids (ContextSnapshotId, GraphSnapshotId, and FindingsSnapshotId are all required for architecture run commit).");

        Task<AgentEvidencePackage> evidenceTask = GetEvidencePackageForCommitOrThrowAsync(runId, cancellationToken);
        Task<GraphSnapshot?> graphTask = _graphSnapshotRepository.GetByIdAsync(scope, graphId, cancellationToken);
        Task<IReadOnlyList<AgentResult>> agentResultsTask =
            _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken);
        Task<FindingsSnapshot?> findingsTask = _findingsSnapshotRepository.GetByIdAsync(scope, findingsId, cancellationToken);
        Task<IReadOnlyList<PolicyPackAssignment>> scopeAssignmentsTask =
            _policyPackAssignmentRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken);

        await Task.WhenAll(evidenceTask, graphTask, agentResultsTask, findingsTask, scopeAssignmentsTask);

        AgentEvidencePackage evidencePackageForTelemetry = await evidenceTask;
        GraphSnapshot? graph = await graphTask;

        if (graph is null)
            throw new InvalidOperationException($"Graph snapshot '{graphId:D}' for run '{runId}' was not found.");

        IReadOnlyList<AgentResult> agentResultsForTelemetry = await agentResultsTask;
        GraphSnapshot graphForDecision = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, agentResultsForTelemetry);
        await _graphMergeRuntimeInvariantReporter.ReportAfterMergeAsync(scope, graphForDecision, cancellationToken);
        FindingsSnapshot? findings = await findingsTask;
        IReadOnlyList<PolicyPackAssignment> scopePolicyPackAssignments = await scopeAssignmentsTask;

        if (findings is null)
            throw new InvalidOperationException($"Findings snapshot '{findingsId:D}' for run '{runId}' was not found.");

        ManifestDocument manifestModel;
        DecisionTraceDto traceDto;
        bool skipPersistingPipelineArtifacts = false;
        CommitPipelineManifestReuseResult? reusedManifest = await _commitPipelineManifestReuseService.TryReusePipelineManifestAsync(
            run,
            runGuid,
            contextSnapshotId,
            graph,
            graphForDecision,
            findings,
            scope,
            cancellationToken);

        if (reusedManifest is not null)
        {
            manifestModel = reusedManifest.Manifest;
            traceDto = reusedManifest.TraceDto;
            skipPersistingPipelineArtifacts = true;
        }
        else
        {
            (manifestModel, traceDto) = await _decisionEngine.DecideAsync(
                runGuid,
                contextSnapshotId,
                graphForDecision,
                findings,
                cancellationToken);
        }

        DecisionTrace trace = DecisionTraceRecordMapper.ToDomain(traceDto);
        ApplyRuleAuditScope(trace, scope);
        ApplyAuthorityManifestScope(manifestModel, scope);
        Cm.GoldenManifest contract = await _projectionBuilder.BuildAsync(
            manifestModel,
            new AuthorityCommitProjectionInput { SystemName = request.SystemName },
            cancellationToken);
        AlignAuthorityVersionToContract(manifestModel, contract);
        IReadOnlyList<string> traceabilityGaps = AuthorityCommitTraceabilityRules.GetLinkageGaps(contract, [trace]);

        if (traceabilityGaps.Count > 0)
            throw new InvalidOperationException("Committed manifest traceability (authority) invariant failed: " + string.Join("; ", traceabilityGaps));

        await _commitOutputIntegrityService.EnsurePassOrThrowAsync(
            run,
            runId,
            findings,
            request,
            commitOptions?.AcknowledgedAssumptionIds,
            cancellationToken);

        string contractWireJson = JsonSerializer.Serialize(contract, ContractJson.Default);

        return new AuthorityCommitDecisionMaterializationResult
        {
            ManifestModel = manifestModel,
            TraceDto = traceDto,
            Trace = trace,
            Contract = contract,
            ContractWireJson = contractWireJson,
            EvidencePackageForTelemetry = evidencePackageForTelemetry,
            AgentResultsForTelemetry = agentResultsForTelemetry,
            FindingsForFinalization = findings,
            ScopePolicyPackAssignments = scopePolicyPackAssignments,
            SkipPersistingPipelineArtifacts = skipPersistingPipelineArtifacts
        };
    }

    /// <summary>
    ///     ADR 0030 PR A3 (2026-04-24) — the authority engine stores <c>Metadata.Version</c> as a
    ///     bare semver (e.g. <c>1.0.0</c>), while the projection builder maps it into the contract
    ///     as a <c>v</c>-prefixed version (e.g. <c>v1.0.0</c>). The contract value is what the API
    ///     returns to clients and what subsequent <c>GET /v1/architecture/manifest/{manifestVersion}</c>
    ///     lookups compare against (ordinal exact match on <c>Metadata.Version</c> via
    ///     <c>GetByContractManifestVersionAsync</c>). Without this alignment the persisted row would
    ///     never match the version the client just received → 404. Copying the contract version onto
    ///     the authority row before persistence keeps the read path round-tripping.
    /// </summary>
    internal static void AlignAuthorityVersionToContract(ManifestDocument manifestModel, Cm.GoldenManifest contract)
    {
        if (manifestModel is null)
            throw new ArgumentNullException(nameof(manifestModel));

        if (contract is null)
            throw new ArgumentNullException(nameof(contract));

        if (string.IsNullOrWhiteSpace(contract.Metadata.ManifestVersion))
            return;
        manifestModel.Metadata.Version = contract.Metadata.ManifestVersion;
    }

    private async Task<AgentEvidencePackage> GetEvidencePackageForCommitOrThrowAsync(string runId, CancellationToken cancellationToken)
    {
        // ADR 0030 PR A3 (2026-04-24): missing evidence package = run hasn't been executed yet,
        // which is a conflict with the current run state, not a malformed request → 409 (not 400).
        return await _agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken) ??
               throw new ConflictException($"Run '{runId}' cannot be committed: no evidence package exists. Execute the run first.");
    }

    private static void ApplyRuleAuditScope(DecisionTrace trace, ScopeContext scope)
    {
        DomainRuleAuditTracePayload audit = trace.RequireRuleAudit();
        audit.TenantId = scope.TenantId;
        audit.WorkspaceId = scope.WorkspaceId;
        audit.ProjectId = scope.ProjectId;
    }

    private static void ApplyAuthorityManifestScope(ManifestDocument manifest, ScopeContext scope)
    {
        manifest.TenantId = scope.TenantId;
        manifest.WorkspaceId = scope.WorkspaceId;
        manifest.ProjectId = scope.ProjectId;
    }
}
