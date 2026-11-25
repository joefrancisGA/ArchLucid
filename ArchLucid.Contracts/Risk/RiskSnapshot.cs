using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Risk;

/// <summary>Immutable risk analysis snapshot for one review run (mirrors <see cref="Findings.FindingsSnapshot" />).</summary>
public sealed class RiskSnapshot
{
    public string SnapshotId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    private string reviewRunId = string.Empty;

    public string ReviewRunId
    {
        get => reviewRunId;
        set => reviewRunId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string tenantId = string.Empty;

    public string TenantId
    {
        get => tenantId;
        set => tenantId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public DateTimeOffset CreatedAt
    {
        get;
        set;
    }

    private List<ArchitectureTradeoff> tradeoffs = [];

    public List<ArchitectureTradeoff> Tradeoffs
    {
        get => tradeoffs;
        set => tradeoffs = ContractCollectionDefaults.Coalesce(value);
    }

    private List<RequirementSmell> requirementSmells = [];

    public List<RequirementSmell> RequirementSmells
    {
        get => requirementSmells;
        set => requirementSmells = ContractCollectionDefaults.Coalesce(value);
    }

    private List<SuggestedConcern> concerns = [];

    public List<SuggestedConcern> Concerns
    {
        get => concerns;
        set => concerns = ContractCollectionDefaults.Coalesce(value);
    }

    private List<ExecutionContextItem> executionContext = [];

    public List<ExecutionContextItem> ExecutionContext
    {
        get => executionContext;
        set => executionContext = ContractCollectionDefaults.Coalesce(value);
    }
}
