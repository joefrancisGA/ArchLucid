using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>Human review state for AI-assisted or high-impact findings.</summary>
[JsonConverter(typeof(FindingHumanReviewStatusJsonConverter))]
public enum FindingHumanReviewStatus
{
    NotRequired = 0,
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Overridden = 4
}
