namespace ArchLucid.Application.Drafts.PriorAnswerReuse;

/// <summary>
///     Outcome of applying repeat-pilot answer reuse to a draft document.
/// </summary>
public sealed class DraftPriorAnswerReuseResult
{
    /// <summary>Number of question keys pre-filled from prior run-spawned drafts in the same scope.</summary>
    public int ReusedCount
    {
        get;
        init;
    }

    /// <summary>Question keys that were copied from a prior draft (current draft had no answer).</summary>
    public IReadOnlyList<string> ReusedQuestionKeys
    {
        get;
        init;
    } = [];
}
