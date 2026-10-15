using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

public sealed class EngineVerificationConfirmedRatesResponse
{
    public DateTime FromUtc
    {
        get;
        set;
    }

    public DateTime ToUtcExclusive
    {
        get;
        set;
    }

    private IReadOnlyList<EngineVerificationConfirmedRateRow> rows = [];

    public IReadOnlyList<EngineVerificationConfirmedRateRow> Rows
    {
        get => rows;
        set => rows = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
