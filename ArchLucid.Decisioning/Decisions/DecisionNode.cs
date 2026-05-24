namespace ArchLucid.Decisioning.Decisions;

/// <summary>
///     Represents a single architectural decision point produced by the decision engine
///     during a run. Each node captures the topic debated, the options evaluated, the
///     selected outcome, and the agent evaluations that influenced it.
/// </summary>
public sealed class DecisionNode
{
    public string DecisionId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string Topic
    {
        get;
        set;
    } = string.Empty;

    public IReadOnlyList<DecisionOption> Options
    {
        get;
        set;
    } = [];

    public string? SelectedOptionId
    {
        get;
        set;
    }

    public string Rationale
    {
        get;
        set;
    } = string.Empty;

    public double Confidence
    {
        get;
        set;
    }

    public IReadOnlyList<string> SupportingEvaluationIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> OpposingEvaluationIds
    {
        get;
        set;
    } = [];

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;
}
