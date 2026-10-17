using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

public sealed record SecureNowPackQuestionCandidate
{
    public string ResourceId { get; init; } = string.Empty;

    public string QuestionKey { get; init; } = string.Empty;

    public string QuestionText { get; init; } = string.Empty;

    public string ReasonText { get; init; } = string.Empty;

    public SecureNowQuestionScopeKind ScopeKind { get; init; } = SecureNowQuestionScopeKind.Subscription;

    public IReadOnlyList<string> AnswerCodes { get; init; } = [];

    public string? ResourceType { get; init; }
}
