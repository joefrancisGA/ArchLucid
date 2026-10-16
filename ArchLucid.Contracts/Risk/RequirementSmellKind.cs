namespace ArchLucid.Contracts.Risk;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

[JsonConverter(typeof(DefinedEnumJsonConverter<RequirementSmellKind>))]
public enum RequirementSmellKind
{
    Unjustified = 0,
    Incoherent = 1,
    RoundNumber = 2,
    CostInfeasible = 3,
}
