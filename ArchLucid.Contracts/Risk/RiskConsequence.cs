namespace ArchLucid.Contracts.Risk;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

[JsonConverter(typeof(DefinedEnumJsonConverter<RiskConsequence>))]
public enum RiskConsequence
{
    Low = 0,
    Medium = 1,
    High = 2,
}
