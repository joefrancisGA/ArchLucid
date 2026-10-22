namespace ArchLucid.Contracts.Risk;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

[JsonConverter(typeof(DefinedEnumJsonConverter<ConcernSource>))]
public enum ConcernSource
{
    Architectural = 0,
    ExecutionCredibility = 1,
}
