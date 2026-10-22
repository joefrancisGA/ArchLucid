using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

public sealed partial class FindingAnalysisContextBuilder
{
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
}
