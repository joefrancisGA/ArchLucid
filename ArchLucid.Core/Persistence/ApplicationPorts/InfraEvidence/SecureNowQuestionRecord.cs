namespace ArchLucid.Persistence.InfraEvidence;

public sealed record SecureNowQuestionRecord
{
    public Guid? DispositionId { get; init; }
    public Guid SnapshotId { get; init; }
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public SecureNowQuestionSource Source { get; init; }
    public SecureNowQuestionScopeKind ScopeKind { get; init; }
    public SecureNowQuestionDispositionStatus Status { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string ResourceType { get; init; } = string.Empty;
    public string ResourceName { get; init; } = string.Empty;
    public string ReasonText { get; init; } = string.Empty;
    public string SourceLine { get; init; } = string.Empty;
    public IReadOnlyList<string> AnswerCodes { get; init; } = [];
    public string EvidenceFingerprint { get; init; } = string.Empty;
    public DateTime? ExpirationUtc { get; init; }
    public bool IsExpired { get; init; }
    public string? AnswerCode { get; init; }
    public string? AnswerText { get; init; }
    public string? Reason { get; init; }
}
