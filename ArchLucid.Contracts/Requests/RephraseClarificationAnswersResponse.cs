namespace ArchLucid.Contracts.Requests;

/// <summary>
///     Humanized clarification answers keyed by <see cref="ClarificationAnswerRephraseItem.QuestionKey" />.
/// </summary>
public sealed class RephraseClarificationAnswersResponse
{
    private Dictionary<string, string> rephrasedAnswers = [];

    public IReadOnlyDictionary<string, string> RephrasedAnswers
    {
        get => rephrasedAnswers;
        set => rephrasedAnswers = value is null ? [] : new Dictionary<string, string>(value);
    }
}
