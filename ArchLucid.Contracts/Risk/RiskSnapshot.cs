namespace ArchLucid.Contracts.Risk;

/// <summary>Immutable risk analysis snapshot for one review run (mirrors <see cref="Findings.FindingsSnapshot" />).</summary>
public sealed class RiskSnapshot
{
    public string SnapshotId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string ReviewRunId
    {
        get;
        set;
    } = null!;

    public string TenantId
    {
        get;
        set;
    } = null!;

    public DateTimeOffset CreatedAt
    {
        get;
        set;
    }

    public List<ArchitectureTradeoff> Tradeoffs
    {
        get;
        set;
    } = [];

    public List<RequirementSmell> RequirementSmells
    {
        get;
        set;
    } = [];

    public List<SuggestedConcern> Concerns
    {
        get;
        set;
    } = [];

    public List<ExecutionContextItem> ExecutionContext
    {
        get;
        set;
    } = [];
}
