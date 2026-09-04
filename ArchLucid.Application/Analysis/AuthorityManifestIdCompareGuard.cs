using ArchLucid.Application.Runs;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-21 suggestion 206: pin/inventory fingerprint guards for authority manifest-id compare.</summary>
public static class AuthorityManifestIdCompareGuard
{
    public static async Task EnsurePinAndInventoryFingerprintsMatchOrThrowAsync(
        ManifestDocument left,
        ManifestDocument right,
        ScopeContext scope,
        IRunRepository runRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(runRepository);

        if (left.RunId == Guid.Empty || right.RunId == Guid.Empty)
        {
            throw new ConflictException(
                "Compare blocked: one or both manifests are missing a committed run identifier.");
        }

        Guid leftRunId = left.RunId;
        Guid rightRunId = right.RunId;

        RunRecord? leftHeader = await runRepository.GetByIdAsync(scope, leftRunId, cancellationToken);
        RunRecord? rightHeader = await runRepository.GetByIdAsync(scope, rightRunId, cancellationToken);

        if (leftHeader is null || rightHeader is null)
        {
            throw new ConflictException("Compare blocked: run headers for one or both manifests were not found.");
        }

        RunComparePinFingerprintGuard.EnsureCreateTimePinFingerprintsMatchOrThrow(leftHeader, rightHeader);

        RunComparePinFingerprintGuard.EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow(
            CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(left.CommittedArtifactInventory),
            CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(right.CommittedArtifactInventory));
    }
}
