using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

public sealed class SecureNowPackQuestionCandidateBuilder
{
    private const string PolicyPackSourceLine = "Policy pack";

    private const string UhgSessionHostQuestionText =
        "Is this virtual machine still a session host that should be registered?";

    private static readonly string[] UhgSessionHostAnswerCodes = ["Register", "Retire", "NotASessionHost"];

    public IReadOnlyList<SecureNowPackQuestionCandidate> Build(
        PolicyPackContentDocument effectiveContent,
        GraphSnapshot? graph,
        string subscriptionId)
    {
        ArgumentNullException.ThrowIfNull(effectiveContent);

        string normalizedSubscriptionId = Normalize(subscriptionId);
        if (normalizedSubscriptionId.Length == 0)
            return [];

        List<SecureNowPackQuestionCandidate> candidates = [];
        HashSet<string> assignedRuleKeys = effectiveContent.ComplianceRuleKeys
            .Where(key => !string.IsNullOrWhiteSpace(key))
            .Select(key => key.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (graph is not null
            && assignedRuleKeys.Contains(
                InventoryDiagramQuestionableAttentionResolver.UhgUnregisteredAvdSessionHostRuleKey,
                StringComparer.OrdinalIgnoreCase))
        {
            AppendUhgQuestionableCandidates(candidates, graph);
        }

        foreach (ElicitationQuestion question in effectiveContent.ElicitationQuestions)
        {
            if (question.Tier != ElicitationQuestionTier.Must)
                continue;

            if (string.IsNullOrWhiteSpace(question.QuestionKey) || string.IsNullOrWhiteSpace(question.Prompt))
                continue;

            string questionKey = SecureNowPackQuestionKeyFormatter.EnsureVersionSuffix(question.QuestionKey);
            string prompt = question.Prompt.Trim();

            candidates.Add(new SecureNowPackQuestionCandidate
            {
                ResourceId = string.Empty,
                QuestionKey = questionKey,
                QuestionText = prompt,
                ReasonText = "An assigned policy pack requires this answer before SecureNow can proceed.",
                ScopeKind = SecureNowPackQuestionScopeKindResolver.ResolveFromPrompt(prompt),
                AnswerCodes = SecureNowPackQuestionAnswerCodes.ForElicitation(question.AnswerKind),
            });
        }

        return candidates;
    }

    private static void AppendUhgQuestionableCandidates(
        List<SecureNowPackQuestionCandidate> candidates,
        GraphSnapshot graph)
    {
        IReadOnlyDictionary<string, DiagramQuestionableAttention> questionable =
            InventoryDiagramQuestionableAttentionResolver.Resolve(
                graph,
                [InventoryDiagramQuestionableAttentionResolver.UhgUnregisteredAvdSessionHostRuleKey]);

        foreach ((string nodeId, DiagramQuestionableAttention attention) in questionable)
        {
            GraphNode? node = graph.Nodes.FirstOrDefault(item =>
                string.Equals(item.NodeId, nodeId, StringComparison.Ordinal));

            if (node is null)
                continue;

            string armId = ReadArmId(node);
            if (armId.Length == 0)
                continue;

            string questionKey = SecureNowPackQuestionKeyFormatter.EnsureVersionSuffix(
                InventoryDiagramQuestionableAttentionResolver.UhgUnregisteredAvdSessionHostRuleKey);

            candidates.Add(new SecureNowPackQuestionCandidate
            {
                ResourceId = armId,
                QuestionKey = questionKey,
                QuestionText = UhgSessionHostQuestionText,
                ReasonText = attention.Reason,
                ScopeKind = SecureNowQuestionScopeKind.Resource,
                AnswerCodes = UhgSessionHostAnswerCodes,
                ResourceType = ReadArmType(node),
            });
        }
    }

    private static string ReadArmId(GraphNode node) =>
        node.Properties.TryGetValue("arm.id", out string? value) ? value.Trim() : string.Empty;

    private static string ReadArmType(GraphNode node) =>
        node.Properties.TryGetValue("arm.type", out string? value) ? value.Trim() : string.Empty;

    private static string Normalize(string? value) => value?.Trim().ToLowerInvariant() ?? string.Empty;
}
