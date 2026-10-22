using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>VN-35 shared-service type catalog (delegates to Core for parity with NR-12).</summary>
public static class DiagramSharedServiceCatalog
{
    public static bool IsSharedService(string? armResourceType)
    {
        return InventoryDiagramSharedServiceCatalog.IsSharedService(armResourceType);
    }
}
