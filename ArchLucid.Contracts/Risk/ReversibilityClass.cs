namespace ArchLucid.Contracts.Risk;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>Ordering input: consequence leads; reversibility is the tiebreaker (analyzer §1.2).</summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<ReversibilityClass>))]
public enum ReversibilityClass
{
    Reversible = 0,
    Costly = 1,
    OneWayDoor = 2,
}
