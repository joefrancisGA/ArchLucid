using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

public sealed record SecureNowDiagramQuestionCandidate
{
    public string SubscriptionId { get; init; } = string.Empty;
    public string ResourceId { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public string QuestionText { get; init; } = string.Empty;
    public string ProblemText { get; init; } = string.Empty;
    public SecureNowQuestionScopeKind ScopeKind { get; init; } = SecureNowQuestionScopeKind.Resource;
    public bool IsOrphanIntent { get; init; }
    public bool IsUnknownEvidence { get; init; }
    public bool IsKnownMissingAzureObject { get; init; }
}

public sealed class SecureNowQuestionCompiler
{
    public IReadOnlyList<SecureNowQuestionRecord> Compile(
        ScopeContext scope,
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<SecureNowDiagramQuestionCandidate> diagramCandidates,
        IReadOnlyList<OperatorInferredConnectionRecord> inferredConnections,
        IReadOnlyList<SecureNowQuestionDispositionRecord> dispositions)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(diagramCandidates);
        ArgumentNullException.ThrowIfNull(inferredConnections);
        ArgumentNullException.ThrowIfNull(dispositions);

        string subscriptionId = Normalize(snapshot.Header.SubscriptionId);
        DateTime now = TimeProvider.System.UtcNowDateTime();
        Dictionary<string, SecureNowQuestionDispositionRecord> dispositionsByIdentity =
            dispositions.ToDictionary(
                record => Identity(record.SubscriptionId, record.ResourceId, record.QuestionKey),
                StringComparer.OrdinalIgnoreCase);
        List<SecureNowQuestionRecord> questions = [];
        HashSet<string> emitted = new(StringComparer.OrdinalIgnoreCase);

        foreach (OperatorInferredConnectionRecord inferred in inferredConnections
                     .Where(record => record.Status == OperatorInferredConnectionStatus.Proposed)
                     .OrderByDescending(record => record.FromArmId is not null && record.ToArmId is not null)
                     .ThenBy(record => record.ConnectionId))
        {
            string resourceId = Normalize(inferred.FromArmId ?? inferred.ToArmId);
            string questionKey = $"{NormalizeKey(inferred.RuleName ?? "inferred-connection")}@v1";
            string fingerprint = Fingerprint(
                questionKey,
                resourceId,
                $"{inferred.FromArmId}|{inferred.ToArmId}|{inferred.ToHost}|{inferred.ToCatalog}");
            AddQuestion(
                questions,
                emitted,
                dispositionsByIdentity,
                new SecureNowQuestionRecord
                {
                    SnapshotId = snapshot.Header.SnapshotId,
                    SubscriptionId = subscriptionId,
                    ResourceId = resourceId,
                    QuestionKey = questionKey,
                    Source = SecureNowQuestionSource.InferredConnection,
                    ScopeKind = SecureNowQuestionScopeKind.Resource,
                    QuestionText = inferred.QuestionText ?? "Should SecureNow record this inferred connection?",
                    SourceLine = "Inferred connection",
                    AnswerCodes = ["Yes", "No", "NotSure"],
                    EvidenceFingerprint = fingerprint,
                    Status = SecureNowQuestionDispositionStatus.Open,
                },
                now);
        }

        foreach (SecureNowDiagramQuestionCandidate candidate in diagramCandidates)
        {
            if (candidate.IsKnownMissingAzureObject
                || (!candidate.IsOrphanIntent && !candidate.IsUnknownEvidence))
                continue;

            string questionKey = candidate.IsOrphanIntent
                ? "orphan-still-needed@v1"
                : "unknown-evidence@v1";
            if (candidate.IsUnknownEvidence
                && string.IsNullOrWhiteSpace(candidate.ProblemText))
                continue;

            string fingerprint = Fingerprint(questionKey, candidate.ResourceId, candidate.ProblemText);
            AddQuestion(
                questions,
                emitted,
                dispositionsByIdentity,
                new SecureNowQuestionRecord
                {
                    SnapshotId = snapshot.Header.SnapshotId,
                    SubscriptionId = subscriptionId,
                    ResourceId = Normalize(candidate.ResourceId),
                    QuestionKey = questionKey,
                    Source = SecureNowQuestionSource.InventoryEvidence,
                    ScopeKind = candidate.ScopeKind,
                    QuestionText = candidate.IsOrphanIntent
                        ? "Is this still needed?"
                        : "Should this resource connect to a peer, or stand alone?",
                    SourceLine = "Inventory evidence",
                    AnswerCodes = candidate.IsOrphanIntent
                        ? ["Retire", "Keep", "NotSure"]
                        : ["NamePeer", "StandsAlone", "NotSure"],
                    EvidenceFingerprint = fingerprint,
                    Status = SecureNowQuestionDispositionStatus.Open,
                },
                now);
        }

        return questions;
    }

    private static void AddQuestion(
        List<SecureNowQuestionRecord> questions,
        HashSet<string> emitted,
        IReadOnlyDictionary<string, SecureNowQuestionDispositionRecord> dispositions,
        SecureNowQuestionRecord question,
        DateTime now)
    {
        string identity = Identity(question.SubscriptionId, question.ResourceId, question.QuestionKey);
        if (!emitted.Add(identity))
            return;

        if (dispositions.TryGetValue(identity, out SecureNowQuestionDispositionRecord? disposition)
            && string.Equals(
                disposition.EvidenceFingerprint,
                question.EvidenceFingerprint,
                StringComparison.Ordinal)
            && disposition.ExpirationUtc > now)
        {
            question = question with
            {
                DispositionId = disposition.DispositionId,
                Status = disposition.Status,
                ExpirationUtc = disposition.ExpirationUtc,
                AnswerCode = disposition.AnswerCode,
                AnswerText = disposition.AnswerText,
                Reason = disposition.Reason,
            };
        }

        questions.Add(question);
    }

    private static string Identity(string subscriptionId, string resourceId, string questionKey) =>
        $"{Normalize(subscriptionId)}|{Normalize(resourceId)}|{questionKey.Trim()}";

    private static string Fingerprint(string questionKey, string resourceId, string problemText) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            $"{questionKey.Trim()}\n{Normalize(resourceId)}\n{problemText.Trim()}")));

    private static string Normalize(string? value) => value?.Trim().ToLowerInvariant() ?? string.Empty;

    private static string NormalizeKey(string value)
    {
        string normalized = new(value
            .Trim()
            .ToLowerInvariant()
            .Select(character => char.IsLetterOrDigit(character) ? character : '-')
            .ToArray());
        return normalized.Trim('-');
    }
}
