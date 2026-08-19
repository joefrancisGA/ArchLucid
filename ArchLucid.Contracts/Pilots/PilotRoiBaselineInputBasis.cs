namespace ArchLucid.Contracts.Pilots;

/// <summary>How a single ROI baseline input was sourced for sponsor-facing proof JSON.</summary>
public enum PilotRoiBaselineInputBasis
{
    BuyerProvided,

    Defaulted,

    DemoDerived,

    NotCollected,
}
