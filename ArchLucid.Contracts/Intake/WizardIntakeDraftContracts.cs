namespace ArchLucid.Contracts.Intake;

public sealed class WizardIntakeDraftResponse
{
    public string WizardId
    {
        get;
        set;
    } = string.Empty;

    public int StepIndex
    {
        get;
        set;
    }

    public string StateJson
    {
        get;
        set;
    } = "{}";

    public DateTime UpdatedUtc
    {
        get;
        set;
    }
}

public sealed class UpsertWizardIntakeDraftRequest
{
    public int StepIndex
    {
        get;
        set;
    }

    public string StateJson
    {
        get;
        set;
    } = "{}";

    public string? IdempotencyKey
    {
        get;
        set;
    }
}
