namespace ArchLucid.Contracts.Requests;

/// <summary>
///     Humanized clarification answers keyed by <see cref="ClarificationAnswerRephraseItem.QuestionKey" />.
/// </summary>
public sealed class RephraseClarificationAnswersResponse
{
    public IReadOnlyDictionary<string, string> RephrasedAnswers
    {
        get;
        set;
    } = new Dictionary<string, string>();
}
