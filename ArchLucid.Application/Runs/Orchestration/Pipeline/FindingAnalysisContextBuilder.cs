using ArchLucid.Application.Architecture;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Governance;
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

/// <remarks>
///     Build pipeline stages live in <c>FindingAnalysisContextBuilder.PinLoad</c>,
///     <c>.HashGuard</c>, and <c>.PriorResolve</c> partials.
/// </remarks>
public sealed partial class FindingAnalysisContextBuilder(
    IRunRepository runRepository,
    IArchitectureVersionRepository architectureVersionRepository,
    IPolicyPackVersionRepository policyPackVersionRepository,
    IRunEvidencePackagePinService runEvidencePackagePinService,
    IRunPolicyPackPinService runPolicyPackPinService) : IFindingAnalysisContextBuilder
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureVersionRepository _architectureVersionRepository =
        architectureVersionRepository ?? throw new ArgumentNullException(nameof(architectureVersionRepository));

    private readonly IPolicyPackVersionRepository _policyPackVersionRepository =
        policyPackVersionRepository ?? throw new ArgumentNullException(nameof(policyPackVersionRepository));

    private readonly IRunEvidencePackagePinService _runEvidencePackagePinService =
        runEvidencePackagePinService ?? throw new ArgumentNullException(nameof(runEvidencePackagePinService));

    private readonly IRunPolicyPackPinService _runPolicyPackPinService =
        runPolicyPackPinService ?? throw new ArgumentNullException(nameof(runPolicyPackPinService));

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

        await VerifyPinIntegrityAsync(header, scope, cancellationToken).ConfigureAwait(false);

        PriorReviewSnapshots? prior = await TryResolvePriorAsync(scope, header, request, cancellationToken)
            .ConfigureAwait(false);

        (IReadOnlyList<string> packIds, IReadOnlyList<PolicyPackContentDocument> packContents) =
            await ResolvePinnedPolicyPacksAsync(scope, header, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<EvidencePackagePin> evidencePins = _runEvidencePackagePinService.ResolvePinsFromHeader(header);
        EvidencePackagePin? primaryEvidencePin = evidencePins
            .FirstOrDefault(pin => string.Equals(pin.Provider, RunEvidencePackagePinService.AzureProvider, StringComparison.OrdinalIgnoreCase))
            ?? evidencePins.FirstOrDefault();

        await EnsurePinnedArchitectureVersionHashUnchangedOrThrowAsync(scope, header, request, knowledgeModel, cancellationToken)
            .ConfigureAwait(false);
        await EnsurePinnedKnowledgeModelContentHashUnchangedOrThrowAsync(header, knowledgeModel, cancellationToken)
            .ConfigureAwait(false);

        return new FindingAnalysisContext
        {
            RunId = runId,
            ContextSnapshotId = contextSnapshot.SnapshotId,
            ArchitectureVersionId = header?.ArchitectureVersionId,
            EnabledPolicyPackIds = packIds,
            RequiredFindingCategories = PolicyPackRequiredFindingCategoryResolver.ResolveRequiredCategories(packIds),
            RequiredEngineTypes = PolicyPackRequiredEngineTypeResolver.ResolveRequiredEngineTypes(packContents),
            Prior = prior,
            ContextCanonicalFingerprint = GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot),
            KnowledgeModelFingerprint = GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(
                knowledgeModel),
            EvidencePin = primaryEvidencePin,
            EvidencePins = evidencePins,
            HasCreateTimeEvidencePinCommitment = _runEvidencePackagePinService.HasCreateTimePinCommitment(header),
        };
    }
}
