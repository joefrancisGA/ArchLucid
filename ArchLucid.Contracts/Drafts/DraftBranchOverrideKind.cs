using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Drafts;

/// <summary>Single ceteris-paribus dimension overridden on a what-if branch (R12).</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DraftBranchOverrideKind
{
    QuestionAnswer,
    BusinessOutcome,
    FreeTextIntent,
    SystemName,
}
