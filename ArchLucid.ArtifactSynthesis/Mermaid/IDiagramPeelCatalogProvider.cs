using ArchLucid.Contracts.InfraEvidence.DiagramPeel;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>Supplies the peel catalog for inventory diagram readability reduction (IE-17).</summary>
public interface IDiagramPeelCatalogProvider
{
    Task<DiagramPeelCatalogSnapshot> GetCatalogAsync(CancellationToken cancellationToken = default);
}
