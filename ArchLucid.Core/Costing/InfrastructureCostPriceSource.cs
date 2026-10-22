namespace ArchLucid.Core.Costing;

/// <summary>Indicates how a monthly USD line item was produced.</summary>
public enum InfrastructureCostPriceSource
{
    /// <summary>Derived from the public Azure Retail Prices API (consumption meters).</summary>
    RetailApi = 0,

    /// <summary>Illustrative fallback (not from live pricing).</summary>
    Estimated = 1,

    /// <summary>Unable to classify (treated like illustrative for UX).</summary>
    Unknown = 2
}
