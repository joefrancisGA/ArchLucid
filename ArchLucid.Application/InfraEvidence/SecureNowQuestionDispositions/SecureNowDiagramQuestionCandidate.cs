using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

public sealed record SecureNowDiagramQuestionCandidate
{
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public string QuestionText { get; init; } = string.Empty;
    public string ProblemText { get; init; } = string.Empty;
    public string ResourceType { get; init; } = string.Empty;
    public SecureNowQuestionScopeKind ScopeKind { get; init; } = SecureNowQuestionScopeKind.Resource;
    public bool IsOrphanIntent { get; init; }
    public bool IsUnknownEvidence { get; init; }
    public bool IsKnownMissingAzureObject { get; init; }
}
