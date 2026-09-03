using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
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

public sealed class FindingAnalysisContextBuilder(
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

        if (header is not null)
        {
            await _runPolicyPackPinService
                .VerifyPinIntegrityOrThrowAsync(header, scope, cancellationToken)
                .ConfigureAwait(false);
        }

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

    private async Task<(IReadOnlyList<string> PackIds, IReadOnlyList<PolicyPackContentDocument> Contents)>
        ResolvePinnedPolicyPacksAsync(
            ScopeContext scope,
            Persistence.Models.RunRecord? header,
            CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(header?.PinnedPolicyPackIdsJson))
        {
            throw new ConflictException(
                "Finding analysis blocked: run is missing create-time policy pack pin JSON.");
        }

        if (!RunHeaderPinDeserializer.TryDeserializePolicyPackRows(
                header.PinnedPolicyPackIdsJson,
                out PinnedPolicyPackRow[] pinnedRows))
        {
            throw new ConflictException(
                "Finding analysis blocked: run policy pack pin JSON is not a versioned PinnedPolicyPackRow array.");
        }

        IReadOnlyList<PolicyPackContentDocument> pinnedContents =
            await LoadPackContentsForPinnedRowsAsync(scope, pinnedRows, cancellationToken).ConfigureAwait(false);

        string[] pinnedPackIds = pinnedRows
            .Select(static row => row.PolicyPackId)
            .ToArray();

        return (pinnedPackIds, pinnedContents);
    }

    private async Task<IReadOnlyList<PolicyPackContentDocument>> LoadPackContentsForPinnedRowsAsync(
        ScopeContext scope,
        IReadOnlyList<PinnedPolicyPackRow> pinnedRows,
        CancellationToken cancellationToken)
    {
        List<PolicyPackContentDocument> contents = [];

        foreach (PinnedPolicyPackRow row in pinnedRows)
        {
            if (!Guid.TryParse(row.PolicyPackId, out Guid packId))
                continue;

            PolicyPackVersion? version = await _policyPackVersionRepository
                .GetByPackAndVersionAsync(packId, row.PolicyPackVersion, cancellationToken)
                .ConfigureAwait(false);

            PolicyPackContentDocument? document = PolicyPackContentDocumentJson.TryDeserialize(version?.ContentJson);

            if (document is not null)
                contents.Add(document);
        }

        return contents;
    }

    private async Task EnsurePinnedArchitectureVersionHashUnchangedOrThrowAsync(
        ScopeContext scope,
        Persistence.Models.RunRecord? header,
        ArchitectureRequest? request,
        ArchitectureKnowledgeModel? knowledgeModel,
        CancellationToken cancellationToken)
    {
        if (header?.ArchitectureVersionId is not Guid versionId || versionId == Guid.Empty)
            return;

        if (header.PinnedArchitectureVersionContentHashSha256 is not { Length: > 0 })
        {
            throw new ConflictException(
                "Finding analysis blocked: run is missing create-time architecture version content hash (κ) pin.");
        }

        byte[] pinnedHash = header.PinnedArchitectureVersionContentHashSha256;

        ArchitectureVersionRecord? version = await _architectureVersionRepository
            .GetByIdAsync(scope, versionId, cancellationToken)
            .ConfigureAwait(false);

        if (version is null)
        {
            throw new ConflictException(
                "Finding analysis blocked: pinned ArchitectureVersionId was not found.");
        }

        if (!version.ContentHashSha256.AsSpan().SequenceEqual(pinnedHash))
        {
            throw new ConflictException(
                "Finding analysis blocked: architecture version content hash (κ) drifted since run create.");
        }

        if (request is null)
            return;

        ArchitectureVersionContentFingerprintVerifier.EnsurePinnedVersionMatchesRequestOrThrow(
            version,
            request,
            knowledgeModel);
    }

    private static Task EnsurePinnedKnowledgeModelContentHashUnchangedOrThrowAsync(
        Persistence.Models.RunRecord? header,
        ArchitectureKnowledgeModel? knowledgeModel,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (header is null || string.IsNullOrWhiteSpace(header.KnowledgeModelId))
            return Task.CompletedTask;

        if (header.PinnedKnowledgeModelContentHashSha256 is not { Length: > 0 })
        {
            throw new ConflictException(
                "Finding analysis blocked: run is missing create-time knowledge model content hash pin.");
        }

        byte[]? computed = KnowledgeModelContentFingerprint.TryComputeContentHashSha256(knowledgeModel);

        if (computed is null || !computed.AsSpan().SequenceEqual(header.PinnedKnowledgeModelContentHashSha256))
        {
            throw new ConflictException(
                "Finding analysis blocked: knowledge model content hash drifted since run create.");
        }

        return Task.CompletedTask;
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

        if (currentVersion is null)
            return null;

        Guid? requestPriorRunId = request is null
            ? null
            : ArchitectureReviewSourceRunResolver.TryResolveSourceRunId(request);

        if (requestPriorRunId is Guid parsedRequestPriorRunId && parsedRequestPriorRunId != Guid.Empty)
        {
            Persistence.Models.RunRecord? requestPriorHeader =
                await _runRepository.GetByIdAsync(scope, parsedRequestPriorRunId, cancellationToken).ConfigureAwait(false);

            if (requestPriorHeader is not null)
            {
                return BuildPriorSnapshots(requestPriorHeader, parsedRequestPriorRunId);
            }
        }

        if (currentVersion.VersionNumber <= 1)
            return null;

        ArchitectureVersionRecord? predecessor = await _architectureVersionRepository
            .GetByArchitectureIdAndVersionNumberAsync(
                scope,
                currentVersion.ArchitectureId,
                currentVersion.VersionNumber - 1,
                cancellationToken)
            .ConfigureAwait(false);

        if (predecessor is null)
            return null;

        Guid? priorRunId = await _runRepository
            .GetLatestCommittedRunIdByArchitectureVersionIdAsync(scope, predecessor.ArchitectureVersionId, cancellationToken)
            .ConfigureAwait(false);

        if (priorRunId is not Guid parsedPriorRunId || parsedPriorRunId == Guid.Empty)
            return null;

        Persistence.Models.RunRecord? priorHeader =
            await _runRepository.GetByIdAsync(scope, parsedPriorRunId, cancellationToken).ConfigureAwait(false);

        if (priorHeader is null)
            return null;

        return BuildPriorSnapshots(priorHeader, parsedPriorRunId);
    }

    private static PriorReviewSnapshots BuildPriorSnapshots(
        Persistence.Models.RunRecord priorHeader,
        Guid priorRunId) =>
        new()
        {
            PriorArchitectureVersionId = priorHeader.ArchitectureVersionId,
            PriorGraphSnapshotId = priorHeader.GraphSnapshotId,
            PriorFindingsSnapshotId = priorHeader.FindingsSnapshotId,
            PriorRunId = priorRunId,
            PriorPinnedPolicyPackIdsHashSha256Hex =
                RunHeaderPinFingerprint.ToHexOrNull(priorHeader.PinnedPolicyPackIdsHashSha256),
            PriorPinnedEvidencePackagePinsHashSha256Hex =
                RunHeaderPinFingerprint.ToHexOrNull(priorHeader.PinnedEvidencePackagePinsHashSha256),
            PriorPinnedArchitectureVersionContentHashSha256Hex =
                RunHeaderPinFingerprint.ToHexOrNull(priorHeader.PinnedArchitectureVersionContentHashSha256),
            PriorPinnedKnowledgeModelContentHashSha256Hex =
                RunHeaderPinFingerprint.ToHexOrNull(priorHeader.PinnedKnowledgeModelContentHashSha256),
        };
}
