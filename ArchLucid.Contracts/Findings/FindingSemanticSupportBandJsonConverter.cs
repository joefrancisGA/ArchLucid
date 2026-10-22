using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Deserializes <see cref="FindingSemanticSupportBand" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class FindingSemanticSupportBandJsonConverter : DefinedEnumJsonConverter<FindingSemanticSupportBand>
{
    protected override string ValueLabel => "finding semantic support band";
}
