namespace ArchLucid.Persistence.InfraEvidence;

public enum SecureNowQuestionSource
{
    InventoryEvidence = 1,
    InferredConnection = 2,
    PolicyPack = 3,
}

public enum SecureNowQuestionScopeKind
{
    Resource = 1,
    ResourceGroup = 2,
    Subscription = 3,
}

public enum SecureNowQuestionDispositionStatus
{
    Open = 1,
    Answered = 2,
    Ignored = 3,
}

public sealed record SecureNowQuestionDispositionRecord
{
    public Guid DispositionId { get; init; }
    public Guid TenantId { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid ProjectId { get; init; }
    public Guid SnapshotId { get; init; }
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public SecureNowQuestionSource Source { get; init; }
    public SecureNowQuestionScopeKind ScopeKind { get; init; }
    public SecureNowQuestionDispositionStatus Status { get; init; }
    public string? AnswerCode { get; init; }
    public string? AnswerText { get; init; }
    public string Reason { get; init; } = string.Empty;
    public DateTime ExpirationUtc { get; init; }
    public string EvidenceFingerprint { get; init; } = string.Empty;
    public string ActorKey { get; init; } = string.Empty;
    public DateTime UpdatedUtc { get; init; }
    public bool IsExpired { get; init; }
    public IReadOnlyList<SecureNowQuestionDispositionAuditEntry> AuditEntries { get; init; } = [];
}

public sealed class SecureNowQuestionDispositionAuditEntry
{
    public string Action { get; init; } = string.Empty;
    public string ActorKey { get; init; } = string.Empty;
    public DateTime OccurredUtc { get; init; }
    public string Reason { get; init; } = string.Empty;
}
