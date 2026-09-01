namespace ArchLucid.Api.Models.Tenancy;

public sealed class CorePilotChecklistPutRequest
{
    public int StepIndex
    {
        get;
        set;
    }

    public bool? IsCompleted
    {
        get;
        set;
    }
}
