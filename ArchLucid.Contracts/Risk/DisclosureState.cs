namespace ArchLucid.Contracts.Risk;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

[JsonConverter(typeof(DefinedEnumJsonConverter<DisclosureState>))]
public enum DisclosureState
{
    DisclosedOk = 0,
    DisclosedRisk = 1,
    Undisclosed = 2,
}
