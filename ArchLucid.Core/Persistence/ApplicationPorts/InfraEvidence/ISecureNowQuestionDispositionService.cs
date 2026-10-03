using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecureNowQuestionDispositionService
{
    Task<IReadOnlyList<SecureNowQuestionRecord>> ListQuestionsAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecureNowQuestionDispositionRecord>> ListAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<SecureNowQuestionDispositionMutationResult> AnswerAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionWriteRequest request,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<SecureNowQuestionDispositionMutationResult> IgnoreAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionWriteRequest request,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<SecureNowQuestionDispositionMutationResult> ReopenAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionReopenRequest request,
        string actorKey,
        CancellationToken cancellationToken = default);
}

public sealed record SecureNowQuestionDispositionWriteRequest
{
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public SecureNowQuestionSource Source { get; init; }
    public SecureNowQuestionScopeKind ScopeKind { get; init; }
    public string? AnswerCode { get; init; }
    public string? AnswerText { get; init; }
    public string Reason { get; init; } = string.Empty;
    public DateTime? ExpirationUtc { get; init; }
    public string EvidenceFingerprint { get; init; } = string.Empty;
}

public sealed class SecureNowQuestionDispositionReopenRequest
{
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}

public sealed class SecureNowQuestionDispositionMutationResult
{
    public bool Succeeded { get; init; }
    public string? ErrorMessage { get; init; }
    public SecureNowQuestionDispositionRecord? Record { get; init; }
}
