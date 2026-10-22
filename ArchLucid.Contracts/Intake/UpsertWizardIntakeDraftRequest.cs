namespace ArchLucid.Contracts.Intake;

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
