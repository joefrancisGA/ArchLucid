using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Applies operator clarification answers onto κ <see cref="ArchitectureElementKind.UnresolvedQuestion" /> rows.
/// </summary>
public interface IKnowledgeModelClarificationAnswerApplicator
{
    Task<int> ApplyAnswersAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyDictionary<string, string> answers,
        CancellationToken cancellationToken = default);
}

public sealed class KnowledgeModelClarificationAnswerApplicator(
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess) : IKnowledgeModelClarificationAnswerApplicator
{
    internal const string KnowledgeModelQuestionIdPrefix = "km-";

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    public async Task<int> ApplyAnswersAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyDictionary<string, string> answers,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(answers);

        if (_knowledgeModelAccess is null || runId == Guid.Empty || answers.Count == 0)
            return 0;

        ArchitectureKnowledgeModel? model = await _knowledgeModelAccess
            .GetForRunAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null)
            return 0;

        int applied = 0;

        foreach (KeyValuePair<string, string> entry in answers)
        {
            string questionId = entry.Key?.Trim() ?? string.Empty;
            string answer = entry.Value?.Trim() ?? string.Empty;

            if (questionId.Length == 0 || answer.Length == 0)
                continue;

            if (!TryResolveElementId(questionId, out string elementId))
                continue;

            ArchitectureModelElement? element = model.Elements
                .FirstOrDefault(candidate => string.Equals(candidate.ElementId, elementId, StringComparison.Ordinal));

            if (element is null || element.Kind != ArchitectureElementKind.UnresolvedQuestion)
                continue;

            element.Description = answer;
            element.Provenance ??= new ClaimProvenance();
            element.Provenance.Notes = "Operator clarification answer applied.";
            element.Provenance.SupportStatus = SupportStatus.DirectlyEstablished;

            if (element.Name.StartsWith(
                    KnowledgeModelInterviewQuestionDeriver.BlockedCheckNamePrefix,
                    StringComparison.OrdinalIgnoreCase))
            {
                model.Elements.Remove(element);
            }

            applied++;
        }

        if (applied == 0)
            return 0;

        int unresolvedRemaining = model.Elements.Count(candidate =>
            candidate.Kind == ArchitectureElementKind.UnresolvedQuestion);

        model.IsProvisionalSynthesis = unresolvedRemaining > 0;
        model.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        await _knowledgeModelAccess.SaveForRunAsync(scope, runId, model, cancellationToken).ConfigureAwait(false);

        return applied;
    }

    private static bool TryResolveElementId(string questionId, out string elementId)
    {
        if (questionId.StartsWith(KnowledgeModelQuestionIdPrefix, StringComparison.OrdinalIgnoreCase))
        {
            elementId = questionId[KnowledgeModelQuestionIdPrefix.Length..];

            return elementId.Length > 0;
        }

        elementId = string.Empty;

        return false;
    }
}
