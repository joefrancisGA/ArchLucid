using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

public sealed partial class FindingAnalysisContextBuilder
{
    public async Task<FindingAnalysisContext> BuildForHeldCheckSecondPassAsync(
        ScopeContext scope,
        Guid runId,
        ContextSnapshot contextSnapshot,
        ArchitectureKnowledgeModel? knowledgeModel,
        ArchitectureRequest? request,
        HeldCheckInputCode inventoryInputCode,
        Guid ingestedPackageId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        Persistence.Models.RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        // Policy pack pins still apply; only evidence pin drift is bypassed so the freshly uploaded ZIP can unblock engines.
        await _runPolicyPackPinService
            .VerifyPinIntegrityOrThrowAsync(header!, scope, cancellationToken)
            .ConfigureAwait(false);

        PriorReviewSnapshots? prior = await TryResolvePriorAsync(scope, header, request, cancellationToken)
            .ConfigureAwait(false);

        (IReadOnlyList<string> packIds, IReadOnlyList<PolicyPackContentDocument> packContents) =
            await ResolvePinnedPolicyPacksAsync(scope, header, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<EvidencePackagePin> evidencePins = BuildSecondPassEvidencePins(
            header,
            inventoryInputCode,
            ingestedPackageId);

        EvidencePackagePin? primaryEvidencePin = evidencePins
            .FirstOrDefault(pin => string.Equals(
                pin.Provider,
                RunEvidencePackagePinService.AzureProvider,
                StringComparison.OrdinalIgnoreCase))
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
            HeldCheckLedger = new HeldCheckLedger(),
        };
    }

    private IReadOnlyList<EvidencePackagePin> BuildSecondPassEvidencePins(
        Persistence.Models.RunRecord? header,
        HeldCheckInputCode inventoryInputCode,
        Guid ingestedPackageId)
    {
        string provider = inventoryInputCode switch
        {
            HeldCheckInputCode.AzureInventoryZip => RunEvidencePackagePinService.AzureProvider,
            HeldCheckInputCode.AwsInventoryZip => RunEvidencePackagePinService.AwsProvider,
            HeldCheckInputCode.GcpInventoryZip => RunEvidencePackagePinService.GcpProvider,
            _ => throw new ArgumentOutOfRangeException(nameof(inventoryInputCode), inventoryInputCode, "Not an inventory ZIP held-check code."),
        };

        List<EvidencePackagePin> pins = header is null
            ? []
            : ResolvePinsWithoutThrow(header).ToList();

        pins.RemoveAll(pin => string.Equals(pin.Provider, provider, StringComparison.OrdinalIgnoreCase));
        pins.Add(new EvidencePackagePin
        {
            Provider = provider,
            PackageId = ingestedPackageId,
            CollectionUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
        });

        return pins
            .OrderBy(static pin => pin.Provider, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static pin => pin.PackageId)
            .ToArray();
    }

    private IReadOnlyList<EvidencePackagePin> ResolvePinsWithoutThrow(Persistence.Models.RunRecord header)
    {
        try
        {
            return _runEvidencePackagePinService.ResolvePinsFromHeader(header);
        }
        catch
        {
            return [];
        }
    }
}
