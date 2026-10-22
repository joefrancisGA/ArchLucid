namespace ArchLucid.Contracts.Pilots;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>How a single ROI baseline input was sourced for sponsor-facing proof JSON.</summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<PilotRoiBaselineInputBasis>))]
public enum PilotRoiBaselineInputBasis
{
    BuyerProvided,

    Defaulted,

    DemoDerived,

    NotCollected,
}
