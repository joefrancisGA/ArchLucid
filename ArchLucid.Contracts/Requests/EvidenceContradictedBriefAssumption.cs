using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Requests;

/// <summary>
///     A confirmed structured-brief assumption that explicit overview evidence contradicts.
/// </summary>
public sealed class EvidenceContradictedBriefAssumption
{
    [JsonPropertyName("assumption")]
    public string Assumption
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("evidenceNote")]
    public string EvidenceNote
    {
        get;
        set;
    } = string.Empty;
}
