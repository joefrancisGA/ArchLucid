namespace ArchLucid.Contracts.Persistence.Decisions;

public sealed class AgentEvaluationRecord
{
    public string EvaluationId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string TargetAgentTaskId
    {
        get;
        set;
    } = string.Empty;

    public string EvaluationType
    {
        get;
        set;
    } = string.Empty;

    public double ConfidenceDelta
    {
        get;
        set;
    }

    public string Rationale
    {
        get;
        set;
    } = string.Empty;

    public List<string> EvidenceRefs
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
