using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Exports;

/// <summary>Exportable JSON artifact for a reasoned no or admission redirect (ADR 0052).</summary>
public sealed class DecisionReceiptDocument
{
    public string SchemaVersion
    {
        get;
        set;
    } = DecisionReceiptConstants.SchemaVersion;

    public DateTime GeneratedUtc
    {
        get;
        set;
    }

    public DecisionReceiptSource Source
    {
        get;
        set;
    }

    public Guid? DraftId
    {
        get;
        set;
    }

    public Guid? RunId
    {
        get;
        set;
    }

    public string? RedirectReason
    {
        get;
        set;
    }

    public DecisionReceiptIntakeContext? Intake
    {
        get;
        set;
    }

    public FeasibilityVerdict Verdict
    {
        get;
        set;
    } = new();

    public DecisionReceiptCostStory CostStory
    {
        get;
        set;
    } = new();
}
