namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Per-task evaluation state frozen at review engine selection time (TB-2105 / TB-2106).
/// </summary>
public sealed class ReviewRunEngineTaskEvaluationSnapshot
{
    public string TaskType
    {
        get;
        set;
    } = string.Empty;

    public string EvaluationState
    {
        get;
        set;
    } = "NotEvaluated";

    public DateTime? EvaluatedUtc
    {
        get;
        set;
    }
}
