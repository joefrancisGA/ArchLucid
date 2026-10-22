namespace ArchLucid.Core.ProductCapability;

/// <summary>OP-04 route gate outcome for a controller endpoint.</summary>
public enum ProductLineRouteGateDecision
{
    Allow = 0,

    Forbidden = 1,

    UnmappedController = 2,
}
