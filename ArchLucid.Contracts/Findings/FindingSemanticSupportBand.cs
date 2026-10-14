using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     AS-059 / ADR 0085: per-finding semantic support band on Working career surfaces (not a commit gate).
/// </summary>
[JsonConverter(typeof(FindingSemanticSupportBandJsonConverter))]
public enum FindingSemanticSupportBand
{
    Supported,
    Unchecked,
    Unsupported,
    NotScored,
}
