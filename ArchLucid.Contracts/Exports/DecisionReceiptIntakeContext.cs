namespace ArchLucid.Contracts.Exports;

/// <summary>Optional intake fields embedded in a decision receipt.</summary>
public sealed class DecisionReceiptIntakeContext
{
    public string? FreeTextIntent
    {
        get;
        set;
    }

    public string? BusinessOutcome
    {
        get;
        set;
    }

    public string? SystemName
    {
        get;
        set;
    }
}
