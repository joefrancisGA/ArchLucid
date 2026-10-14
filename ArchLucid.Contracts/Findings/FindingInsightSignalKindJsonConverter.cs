using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingInsightSignalKind" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingInsightSignalKindJsonConverter : DefinedEnumJsonConverter<FindingInsightSignalKind>
{
    protected override string ValueLabel => "finding insight signal kind";
}
