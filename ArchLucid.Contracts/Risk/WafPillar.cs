namespace ArchLucid.Contracts.Risk;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

[JsonConverter(typeof(DefinedEnumJsonConverter<WafPillar>))]
public enum WafPillar
{
    Reliability = 0,
    Security = 1,
    Cost = 2,
    Operations = 3,
    Performance = 4,
}
