using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Governance;

/// <summary>Captures effective governance metadata onto a manifest before golden commit persistence.</summary>
public interface ICommittedEffectiveGovernanceSnapshotCapturer
{
    Task ApplyToManifestAsync(ManifestDocument manifest, CancellationToken cancellationToken = default);

    Task ApplyToManifestAsync(
        ManifestDocument manifest,
        CommittedEffectiveGovernanceSnapshotCaptureOptions? options,
        CancellationToken cancellationToken = default);
}
