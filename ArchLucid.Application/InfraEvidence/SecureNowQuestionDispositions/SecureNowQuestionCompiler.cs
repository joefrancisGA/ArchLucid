using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using static ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions.SecureNowQuestionDisplayCopy;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

public sealed class SecureNowQuestionCompiler
{
    public IReadOnlyList<SecureNowQuestionRecord> Compile(
        ScopeContext scope,
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<SecureNowPackQuestionCandidate> packCandidates,
        IReadOnlyList<SecureNowDiagramQuestionCandidate> diagramCandidates,
        IReadOnlyList<OperatorInferredConnectionRecord> inferredConnections,
        IReadOnlyList<SecureNowQuestionDispositionRecord> dispositions)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(packCandidates);
        ArgumentNullException.ThrowIfNull(diagramCandidates);
        ArgumentNullException.ThrowIfNull(inferredConnections);
        ArgumentNullException.ThrowIfNull(dispositions);

        string subscriptionId = Normalize(snapshot.Header.SubscriptionId);
        DateTime now = TimeProvider.System.UtcNowDateTime();
        Dictionary<string, SecureNowQuestionDispositionRecord> dispositionsByIdentity = dispositions
            .GroupBy(
                record => Identity(
                    record.SubscriptionId,
                    SecureNowQuestionDispositionResourceIdResolver.Resolve(
                        record.SubscriptionId,
                        record.ResourceId,
                        record.ScopeKind),
                    record.QuestionKey),
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(record => record.UpdatedUtc).First(),
                StringComparer.OrdinalIgnoreCase);
        List<SecureNowQuestionRecord> questions = [];
        HashSet<string> emitted = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, AzureInventoryResourceRecord> resourcesById = snapshot.Resources
            .GroupBy(resource => Normalize(resource.AzureResourceId), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

        foreach (SecureNowPackQuestionCandidate packCandidate in packCandidates
                     .OrderBy(candidate => Normalize(candidate.ResourceId), StringComparer.Ordinal)
                     .ThenBy(candidate => NormalizeQuestionKey(candidate.QuestionKey), StringComparer.Ordinal))
        {
            string questionKey = NormalizeQuestionKey(packCandidate.QuestionKey);

            if (questionKey.Length == 0)
                continue;

            string resourceId = Normalize(packCandidate.ResourceId);
            string fingerprint = Fingerprint(
                questionKey,
                resourceId,
                packCandidate.QuestionText);

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
                    Source = SecureNowQuestionSource.PolicyPack,
                    ScopeKind = packCandidate.ScopeKind,
                    QuestionText = packCandidate.QuestionText,
                    ReasonText = packCandidate.ReasonText,
                    SourceLine = string.Empty,
                    AnswerCodes = packCandidate.AnswerCodes,
                    EvidenceFingerprint = fingerprint,
                    Status = SecureNowQuestionDispositionStatus.Open,
                },
                now,
                resourcesById,
                packCandidate.ResourceType);
        }

        foreach (OperatorInferredConnectionRecord inferred in inferredConnections
                     .Where(record => record.Status == OperatorInferredConnectionStatus.Proposed)
                     .OrderByDescending(record => record.FromArmId is not null && record.ToArmId is not null)
                     .ThenBy(record => record.ConnectionId))
        {
            string resourceId = Normalize(
                string.IsNullOrWhiteSpace(inferred.FromArmId)
                    ? inferred.ToArmId
                    : inferred.FromArmId);

            if (resourceId.Length == 0)
                continue;

            string questionKey =
                $"{NormalizeKey(inferred.RuleName ?? "inferred-connection")}-{inferred.ConnectionId:N}@v1";
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
                    QuestionText = inferred.QuestionText ?? "Question text was not stored.",
                    SourceLine = string.Empty,
                    AnswerCodes = ["Yes", "No", "NotSure"],
                    EvidenceFingerprint = fingerprint,
                    Status = SecureNowQuestionDispositionStatus.Open,
                },
                now,
                resourcesById,
                null);
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
                    SourceLine = string.Empty,
                    AnswerCodes = candidate.IsOrphanIntent
                        ? ["Retire", "Keep", "NotSure"]
                        : ["NamePeer", "StandsAlone", "NotSure"],
                    EvidenceFingerprint = fingerprint,
                    Status = SecureNowQuestionDispositionStatus.Open,
                },
                now,
                resourcesById,
                candidate.ResourceType);
        }

        return questions;
    }

    private static void AddQuestion(
        List<SecureNowQuestionRecord> questions,
        HashSet<string> emitted,
        IReadOnlyDictionary<string, SecureNowQuestionDispositionRecord> dispositions,
        SecureNowQuestionRecord question,
        DateTime now,
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesById,
        string? preferredResourceType = null)

    {

        string dispositionResourceId = SecureNowQuestionDispositionResourceIdResolver.Resolve(
            question.SubscriptionId,
            question.ResourceId,
            question.ScopeKind);
        string identity = Identity(question.SubscriptionId, dispositionResourceId, question.QuestionKey);

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
                AnswerCode = disposition.Status == SecureNowQuestionDispositionStatus.Answered
                    ? disposition.AnswerCode
                    : null,
                AnswerText = disposition.Status == SecureNowQuestionDispositionStatus.Answered
                    ? disposition.AnswerText
                    : null,
                Reason = disposition.Status is SecureNowQuestionDispositionStatus.Answered
                    or SecureNowQuestionDispositionStatus.Ignored
                    ? disposition.Reason
                    : null,
            };
        }

        question = ApplyIdentity(question, resourcesById, preferredResourceType);
        questions.Add(question);
    }

    private static SecureNowQuestionRecord ApplyIdentity(
        SecureNowQuestionRecord question,
        IReadOnlyDictionary<string, AzureInventoryResourceRecord> resourcesById,
        string? preferredResourceType = null)
    {
        string normalizedResourceId = Normalize(question.ResourceId);

        if (normalizedResourceId.Length == 0)
            return WithNoResourceIdentity(question);

        string resourceType = preferredResourceType?.Trim() ?? string.Empty;

        if (resourceType.Length == 0
            && resourcesById.TryGetValue(normalizedResourceId, out AzureInventoryResourceRecord? resource))
        {
            resourceType = resource.ResourceType;
        }

        return WithResourceIdentity(question, resourceType, question.ResourceId);
    }

    private static string Identity(string subscriptionId, string resourceId, string questionKey) =>
        $"{Normalize(subscriptionId)}|{Normalize(resourceId)}|{NormalizeQuestionKey(questionKey)}";

    private static string NormalizeQuestionKey(string? questionKey) =>
        questionKey?.Trim().ToLowerInvariant() ?? string.Empty;

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
