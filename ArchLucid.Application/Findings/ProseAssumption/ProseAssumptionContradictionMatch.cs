using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.ProseAssumption;

/// <summary>Inventory posture that contradicts a mapped prose assumption (DX-55).</summary>
public sealed class ProseAssumptionContradictionMatch
{
    public required ProseAssumptionCandidate Candidate
    {
        get;
        init;
    }

    public required string GraphNodeId
    {
        get;
        init;
    }

    public required string ResourceLabel
    {
        get;
        init;
    }

    public required string InventoryResourceId
    {
        get;
        init;
    }

    public required string InventoryPropertyKey
    {
        get;
        init;
    }

    public required string InventoryValue
    {
        get;
        init;
    }

    public required string CloudLabel
    {
        get;
        init;
    }
}
