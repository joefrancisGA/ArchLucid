namespace ArchLucid.Api.Models.Tenancy;

public sealed class CorePilotChecklistStepResponse
{
    public int StepIndex
    {
        get;
        set;
    }

    public bool IsCompleted
    {
        get;
        set;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        set;
    }

    public string? UpdatedByUserId
    {
        get;
        set;
    }
}

public sealed class CorePilotChecklistPutRequest
{
    public int StepIndex
    {
        get;
        set;
    }

    public bool IsCompleted
    {
        get;
        set;
    }
}
