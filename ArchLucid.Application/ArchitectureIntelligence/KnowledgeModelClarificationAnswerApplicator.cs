using ArchLucid.Application.Clarifications;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Applies operator clarification answers onto κ <see cref="ArchitectureElementKind.UnresolvedQuestion" /> rows
///     and findings-derived clarification framing answers.
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

    internal const string FindingClarificationFramingKeyPrefix = "finding-clarification:";

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

            if (TryApplyKnowledgeModelUnresolvedQuestion(model, questionId, answer))
            {
                applied++;
                continue;
            }

            if (TryApplyFindingClarificationAnswer(model, questionId, answer))
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

    private static bool TryApplyKnowledgeModelUnresolvedQuestion(
        ArchitectureKnowledgeModel model,
        string questionId,
        string answer)
    {
        if (!TryResolveKnowledgeModelElementId(questionId, out string elementId))
            return false;

        ArchitectureModelElement? element = model.Elements
            .FirstOrDefault(candidate => string.Equals(candidate.ElementId, elementId, StringComparison.Ordinal));

        if (element is null || element.Kind != ArchitectureElementKind.UnresolvedQuestion)
            return false;

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

        return true;
    }

    private static bool TryApplyFindingClarificationAnswer(
        ArchitectureKnowledgeModel model,
        string questionId,
        string answer)
    {
        if (!IsFindingClarificationQuestionId(questionId))
            return false;

        string framingKey = $"{FindingClarificationFramingKeyPrefix}{questionId}";
        model.FramingAnswers[framingKey] = answer;

        string formattedAssumption = OperatorAssertedClarificationAnswerFormatter.Format(questionId, answer);
        string elementId = BuildFindingClarificationElementId(questionId);

        ArchitectureModelElement? existing = model.Elements
            .FirstOrDefault(candidate => string.Equals(candidate.ElementId, elementId, StringComparison.Ordinal));

        if (existing is not null)
        {
            existing.Description = formattedAssumption;
            existing.Name = framingKey;
            existing.Provenance ??= new ClaimProvenance();
            existing.Provenance.Notes = "Findings-derived clarification answer applied.";
            existing.Provenance.SupportStatus = SupportStatus.DirectlyEstablished;

            return true;
        }

        model.Elements.Add(new ArchitectureModelElement
        {
            ElementId = elementId,
            Kind = ArchitectureElementKind.Assumption,
            Name = framingKey,
            Description = formattedAssumption,
            ExtractionConfidence = 1.0,
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.UserAsserted,
                SupportStatus = SupportStatus.DirectlyEstablished,
                Confidence = 1.0,
                Notes = "Findings-derived clarification answer applied.",
            },
        });

        return true;
    }

    internal static bool IsFindingClarificationQuestionId(string questionId)
    {
        if (questionId.Length != 16)
            return false;

        foreach (char character in questionId)
        {
            if (!char.IsAsciiHexDigit(character))
                return false;
        }

        return true;
    }

    internal static string BuildFindingClarificationElementId(string questionId)
        => $"fc-{questionId}";

    private static bool TryResolveKnowledgeModelElementId(string questionId, out string elementId)
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
