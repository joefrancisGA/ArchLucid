<<<<<<< HEAD
<<<<<<< HEAD
using System.ComponentModel.DataAnnotations;

=======
>>>>>>> 422d5f5101 (fix(ci): split CorePilot checklist models into one class per file)
=======
>>>>>>> 53be1312b3 (fix(api): make CorePilotChecklistPutRequest.isCompleted a required non-null boolean in OpenAPI contract)
namespace ArchLucid.Api.Models.Tenancy;

public sealed class CorePilotChecklistPutRequest
{
    public int StepIndex
    {
        get;
        set;
    }

<<<<<<< HEAD
<<<<<<< HEAD
    [Required]
=======
>>>>>>> 422d5f5101 (fix(ci): split CorePilot checklist models into one class per file)
    public bool? IsCompleted
=======
    public required bool IsCompleted
>>>>>>> 53be1312b3 (fix(api): make CorePilotChecklistPutRequest.isCompleted a required non-null boolean in OpenAPI contract)
    {
        get;
        set;
    }
}
