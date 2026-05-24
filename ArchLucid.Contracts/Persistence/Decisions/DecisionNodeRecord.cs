namespace ArchLucid.Contracts.Persistence.Decisions;

public sealed class DecisionNodeRecord
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

    public IReadOnlyList<DecisionOptionRecord> Options
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
