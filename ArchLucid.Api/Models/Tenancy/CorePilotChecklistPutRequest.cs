<<<<<<< HEAD
using System.ComponentModel.DataAnnotations;

=======
>>>>>>> 422d5f5101 (fix(ci): split CorePilot checklist models into one class per file)
namespace ArchLucid.Api.Models.Tenancy;

public sealed class CorePilotChecklistPutRequest
{
    public int StepIndex
    {
        get;
        set;
    }

<<<<<<< HEAD
    [Required]
=======
>>>>>>> 422d5f5101 (fix(ci): split CorePilot checklist models into one class per file)
    public bool? IsCompleted
    {
        get;
        set;
    }
}
