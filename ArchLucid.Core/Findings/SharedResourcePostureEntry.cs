namespace ArchLucid.Core.Findings;

/// <summary>Product-shaped inventory resource id and derived posture on one graph node (DX-53).</summary>
public sealed class SharedResourcePostureEntry
{
    public required string NodeId
    {
        get;
        init;
    }

    public required string ResourceIdNormalized
    {
        get;
        init;
    }

    public required string PostureCode
    {
        get;
        init;
    }
}
