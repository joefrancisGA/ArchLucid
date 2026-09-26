using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramInventoryAzureIconResolver
{
    private static readonly AzureArchitectureIconCatalog Catalog = AzureArchitectureIconCatalog.Load();
    private static readonly AzureArchitectureIconCatalogEntry? VirtualMachineIcon =
        Catalog.Resolve("Microsoft.Compute/virtualMachines");

    public static AzureArchitectureIconCatalogEntry? Resolve(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (ShouldUseVirtualMachineIcon(node))
        {
            return VirtualMachineIcon ?? Catalog.Resolve(node.ArmResourceType, node.ArmResourceKind);
        }

        return Catalog.Resolve(node.ArmResourceType, node.ArmResourceKind);
    }

    private static bool ShouldUseVirtualMachineIcon(DiagramNode node)
    {
        if (node.IsAvdCollapsedBoundary)
        {
            return true;
        }

        return InventoryDiagramAvdClassifier.TryClassify(node.ArmResourceType, node.ArmResourceId, out _);
    }
}
