using ArchLucid.Contracts.Serialization;

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

    private IReadOnlyList<DecisionOptionRecord> options = [];

    public IReadOnlyList<DecisionOptionRecord> Options
    {
        get => options;
        set => options = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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

    private IReadOnlyList<string> supportingEvaluationIds = [];

    public IReadOnlyList<string> SupportingEvaluationIds
    {
        get => supportingEvaluationIds;
        set => supportingEvaluationIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> opposingEvaluationIds = [];

    public IReadOnlyList<string> OpposingEvaluationIds
    {
        get => opposingEvaluationIds;
        set => opposingEvaluationIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;
}
