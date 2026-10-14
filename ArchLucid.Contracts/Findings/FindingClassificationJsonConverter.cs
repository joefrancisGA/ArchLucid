using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingClassification" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingClassificationJsonConverter : DefinedEnumJsonConverter<FindingClassification>
{
    protected override string ValueLabel => "finding classification";
}
