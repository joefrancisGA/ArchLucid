using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Requests;

/// <summary>
/// Which structured-brief list a suggested chip belongs to (constraints, assumptions, or required capabilities).
/// </summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<StructuredBriefSuggestionKind>))]
public enum StructuredBriefSuggestionKind
{
    Constraint,

    Assumption,

    RequiredCapability,
}
