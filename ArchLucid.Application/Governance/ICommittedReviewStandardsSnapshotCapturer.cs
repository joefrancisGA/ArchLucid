using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Governance;

/// <summary>Captures sealed review standards onto a manifest before golden commit persistence (TB-2345 item 50).</summary>
public interface ICommittedReviewStandardsSnapshotCapturer
{
    void ApplyToManifest(
        ManifestDocument manifest,
        ArchitectureRequest request,
        FindingsSnapshot findings);
}
