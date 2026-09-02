using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Resolves typed prior revision snapshots and builds <see cref="FindingAnalysisContext" /> for Φ.
/// </summary>
public interface IFindingAnalysisContextBuilder
{
    Task<FindingAnalysisContext> BuildAsync(
        ScopeContext scope,
        Guid runId,
        ContextSnapshot contextSnapshot,
        ArchitectureKnowledgeModel? knowledgeModel,
        ArchitectureRequest? request,
        CancellationToken cancellationToken = default);
}

public sealed class FindingAnalysisContextBuilder(
    IRunRepository runRepository,
    IArchitectureVersionRepository architectureVersionRepository,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository) : IFindingAnalysisContextBuilder
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureVersionRepository _architectureVersionRepository =
        architectureVersionRepository ?? throw new ArgumentNullException(nameof(architectureVersionRepository));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    public async Task<FindingAnalysisContext> BuildAsync(
        ScopeContext scope,
        Guid runId,
        ContextSnapshot contextSnapshot,
        ArchitectureKnowledgeModel? knowledgeModel,
        ArchitectureRequest? request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        Persistence.Models.RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        PriorReviewSnapshots? prior = await TryResolvePriorAsync(scope, header, request, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<PolicyPackAssignment> assignments = await _policyPackAssignmentRepository
            .ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<string> packIds = assignments
            .Where(static assignment => assignment.IsEnabled)
            .Select(static assignment => assignment.PolicyPackId.ToString("D"))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new FindingAnalysisContext
        {
            RunId = runId,
            ContextSnapshotId = contextSnapshot.SnapshotId,
            ArchitectureVersionId = header?.ArchitectureVersionId,
            EnabledPolicyPackIds = packIds,
            RequiredFindingCategories = PolicyPackRequiredFindingCategoryResolver.ResolveRequiredCategories(packIds),
            Prior = prior,
            ContextCanonicalFingerprint = GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot),
            KnowledgeModelFingerprint = GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(
                knowledgeModel),
        };
    }

    private async Task<PriorReviewSnapshots?> TryResolvePriorAsync(
        ScopeContext scope,
        Persistence.Models.RunRecord? header,
        ArchitectureRequest? request,
        CancellationToken cancellationToken)
    {
        if (header?.ArchitectureVersionId is not Guid currentVersionId || currentVersionId == Guid.Empty)
            return null;

        ArchitectureVersionRecord? currentVersion = await _architectureVersionRepository
            .GetByIdAsync(scope, currentVersionId, cancellationToken)
            .ConfigureAwait(false);

        if (currentVersion is null || currentVersion.VersionNumber <= 1)
            return null;

        Guid? priorRunId = request is null
            ? null
            : ArchitectureReviewSourceRunResolver.TryResolveSourceRunId(request);

        if (priorRunId is not Guid parsedPriorRunId || parsedPriorRunId == Guid.Empty)
            return null;

        Persistence.Models.RunRecord? priorHeader =
            await _runRepository.GetByIdAsync(scope, parsedPriorRunId, cancellationToken).ConfigureAwait(false);

        if (priorHeader is null)
            return null;

        return new PriorReviewSnapshots
        {
            PriorArchitectureVersionId = priorHeader.ArchitectureVersionId,
            PriorGraphSnapshotId = priorHeader.GraphSnapshotId,
            PriorFindingsSnapshotId = priorHeader.FindingsSnapshotId,
            PriorRunId = parsedPriorRunId,
        };
    }
}
