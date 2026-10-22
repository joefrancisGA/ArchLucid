namespace ArchLucid.Api.Models.Tenancy;

public sealed class CorePilotChecklistPutRequest
{
    public required int StepIndex
    {
        get;
        set;
    }

    public required bool IsCompleted
    {
        get;
        set;
    }
}
