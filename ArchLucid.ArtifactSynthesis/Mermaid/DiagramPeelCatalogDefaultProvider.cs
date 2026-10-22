using ArchLucid.Contracts.InfraEvidence.DiagramPeel;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>In-process default peel catalog for SQL-disabled hosts and unit tests.</summary>
public sealed class DiagramPeelCatalogDefaultProvider : IDiagramPeelCatalogProvider
{
    public Task<DiagramPeelCatalogSnapshot> GetCatalogAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(DiagramPeelCatalogDefaultSeed.BuildSnapshot());
    }
}
