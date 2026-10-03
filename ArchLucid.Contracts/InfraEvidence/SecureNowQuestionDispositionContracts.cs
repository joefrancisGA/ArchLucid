namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecureNowQuestionDispositionResponse
{
    public Guid DispositionId { get; init; }
    public Guid SnapshotId { get; init; }
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public string Source { get; init; } = string.Empty;
    public string ScopeKind { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? AnswerCode { get; init; }
    public string? AnswerText { get; init; }
    public string Reason { get; init; } = string.Empty;
    public DateTime ExpirationUtc { get; init; }
    public bool IsExpired { get; init; }
    public string EvidenceFingerprint { get; init; } = string.Empty;
    public string ActorKey { get; init; } = string.Empty;
    public DateTime UpdatedUtc { get; init; }
    public IReadOnlyList<SecureNowQuestionDispositionAuditResponse> AuditEntries { get; init; } = [];
}

public sealed class SecureNowQuestionDispositionAuditResponse
{
    public string Action { get; init; } = string.Empty;
    public string ActorKey { get; init; } = string.Empty;
    public DateTime OccurredUtc { get; init; }
    public string Reason { get; init; } = string.Empty;
}

public sealed class SecureNowQuestionDispositionWriteApiRequest
{
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public string Source { get; init; } = string.Empty;
    public string ScopeKind { get; init; } = string.Empty;
    public string? AnswerCode { get; init; }
    public string? AnswerText { get; init; }
    public string Reason { get; init; } = string.Empty;
    public DateTime? ExpirationUtc { get; init; }
    public string EvidenceFingerprint { get; init; } = string.Empty;
}

public sealed class SecureNowQuestionDispositionReopenApiRequest
{
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}
