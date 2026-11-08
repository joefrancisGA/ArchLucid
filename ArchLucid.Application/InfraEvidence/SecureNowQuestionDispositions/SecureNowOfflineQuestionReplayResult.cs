using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

/// <summary>Diagnostic replay subset; never a full findings or policy-pack assessment.</summary>
public sealed class SecureNowOfflineQuestionReplayResult
{
    public string SubscriptionId { get; init; } = string.Empty;
    public string PackageSha256 { get; init; } = string.Empty;
    public DateTime CaptureUtc { get; init; }
    public int ResourceCount { get; init; }
    public int RelationshipCount { get; init; }
    public int CompletenessWarningCount { get; init; }
    public int DiagramCandidates { get; init; }
    public IReadOnlyList<SecureNowQuestionRecord> Questions { get; init; } = [];
}
