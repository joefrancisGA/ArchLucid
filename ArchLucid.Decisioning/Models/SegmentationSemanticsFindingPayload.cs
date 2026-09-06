namespace ArchLucid.Decisioning.Models;

public sealed class SegmentationSemanticsFindingPayload
{
    public string SegmentationNodeId
    {
        get;
        set;
    } = null!;

    public int DestinationPort
    {
        get;
        set;
    }

    public string? TargetNodeId
    {
        get;
        set;
    }

    public int HopCountToTarget
    {
        get;
        set;
    }

    public string MatchedPropertyKey
    {
        get;
        set;
    } = null!;
}
