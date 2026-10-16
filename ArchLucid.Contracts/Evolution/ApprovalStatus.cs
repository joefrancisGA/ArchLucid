namespace ArchLucid.Contracts.Evolution;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>Human-gate state for a 60R candidate change set (simulation does not imply approval).</summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<ApprovalStatus>))]
public enum ApprovalStatus
{
    Unspecified = 0,

    PendingReview,

    Approved,

    Rejected
}
