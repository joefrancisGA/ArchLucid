using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.Findings.ProseAssumption;

/// <summary>Scoped inventory JSON available for prose assumption register classification (DX-61).</summary>
internal sealed class ProseAssumptionInventorySlice
{
    public required InventoryTopologyCloudProvider CloudProvider
    {
        get;
        init;
    }

    public required string ResourcesJson
    {
        get;
        init;
    }
}
