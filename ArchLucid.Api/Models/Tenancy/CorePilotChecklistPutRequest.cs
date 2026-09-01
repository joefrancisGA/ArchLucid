using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Api.Models.Tenancy;

public sealed class CorePilotChecklistPutRequest
{
    public int StepIndex
    {
        get;
        set;
    }

    [Required]
    public bool? IsCompleted
    {
        get;
        set;
    }
}
