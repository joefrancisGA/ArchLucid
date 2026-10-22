using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Core.Persistence.Ports;

public interface IArtifactSynthesisService
{
    Task<ArtifactBundle> SynthesizeAsync(
        ManifestDocument manifest,
        CancellationToken ct);

    Task<ArtifactBundle> SynthesizeAsync(
        ManifestDocument manifest,
        IReadOnlyList<TechnologyLedgerEntry> technologyLedgerEntries,
        CancellationToken ct);
}
