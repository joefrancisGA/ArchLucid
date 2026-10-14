namespace ArchLucid.Contracts.Pilots;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>
///     Conservative tier for comparative ROI narrative confidence (tenant baseline posture), reused by the proof-package
///     contract and ROI evidence section.
/// </summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<PilotRoiEvidenceConfidence>))]
public enum PilotRoiEvidenceConfidence
{
    Strong,
    Partial,
    Low,
}
