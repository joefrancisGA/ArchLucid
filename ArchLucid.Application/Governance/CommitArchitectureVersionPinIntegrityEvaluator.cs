using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Read-side parity for <c>CommitOutputIntegrityService</c> architecture version κ pin checks.
/// </summary>
public static class CommitArchitectureVersionPinIntegrityEvaluator
{
    public static async Task<IReadOnlyList<string>> GetBlockingReasonsAsync(
        ScopeContext scope,
        string runId,
        ArchitectureRequest architectureRequest,
        IRunRepository runRepository,
        IArchitectureVersionRepository architectureVersionRepository,
        IArchitectureKnowledgeModelAccess architectureKnowledgeModelAccess,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(architectureRequest);
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(architectureVersionRepository);
        ArgumentNullException.ThrowIfNull(architectureKnowledgeModelAccess);

        if (!Guid.TryParseExact(runId, "N", out Guid runGuid) && !Guid.TryParse(runId, out runGuid))
        {
            return ["Commit blocked: run id is invalid for architecture version pin verification."];
        }

        RunRecord? header =
            await runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (header?.ArchitectureVersionId is not Guid versionId || versionId == Guid.Empty)
        {
            return ["Commit blocked: run is missing a pinned ArchitectureVersionId."];
        }

        ArchitectureVersionRecord? version = await architectureVersionRepository
            .GetByIdAsync(scope, versionId, cancellationToken)
            .ConfigureAwait(false);

        if (version is null)
        {
            return ["Commit blocked: pinned ArchitectureVersionId was not found."];
        }

        Contracts.ArchitectureIntelligence.ArchitectureKnowledgeModel? knowledgeModel =
            await architectureKnowledgeModelAccess
                .GetForRunAsync(scope, runGuid, cancellationToken)
                .ConfigureAwait(false);

        IReadOnlyList<string> versionMatchReasons =
            ArchitectureVersionContentFingerprintVerifier.GetViolations(version, architectureRequest, knowledgeModel);

        if (versionMatchReasons.Count > 0)
            return versionMatchReasons;

        if (header.PinnedArchitectureVersionContentHashSha256 is not { Length: > 0 } pinnedHash)
        {
            return ["Commit blocked: run is missing create-time architecture version content hash (κ) pin."];
        }

        if (!version.ContentHashSha256.AsSpan().SequenceEqual(pinnedHash))
        {
            return ["Commit blocked: create-time architecture version content hash (κ) drifted since run create."];
        }

        if (!string.IsNullOrWhiteSpace(header.KnowledgeModelId)
            && header.PinnedKnowledgeModelContentHashSha256 is not { Length: > 0 })
        {
            return ["Commit blocked: run is missing create-time knowledge model content hash pin."];
        }

        if (header.PinnedKnowledgeModelContentHashSha256 is { Length: > 0 } pinnedKnowledgeModelHash)
        {
            byte[]? computed = Architecture.KnowledgeModelContentFingerprint.TryComputeContentHashSha256(knowledgeModel);

            if (computed is null || !computed.AsSpan().SequenceEqual(pinnedKnowledgeModelHash))
            {
                return ["Commit blocked: knowledge model content hash drifted since run create."];
            }
        }

        return [];
    }
}
