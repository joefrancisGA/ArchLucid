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
