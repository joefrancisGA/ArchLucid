namespace ArchLucid.Application.Clarifications;

/// <summary>Projects parsed clarification answers onto structured-brief confirmed assumptions.</summary>
public static class ClarificationAnswerProjection
{
    public static IReadOnlyList<string> ProjectConfirmedAssumptions(
        IEnumerable<KeyValuePair<string, string>> answersByQuestionId)
    {
        ArgumentNullException.ThrowIfNull(answersByQuestionId);

        List<string> assumptions = [];

        foreach ((string questionId, string answer) in answersByQuestionId)
        {
            if (string.IsNullOrWhiteSpace(questionId) || string.IsNullOrWhiteSpace(answer))
                continue;

            assumptions.Add(OperatorAssertedClarificationAnswerFormatter.Format(questionId, answer));
        }

        return assumptions;
    }
}
