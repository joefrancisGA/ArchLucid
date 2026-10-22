using ArchLucid.Application;
using ArchLucid.Application.Drafts;

namespace ArchLucid.Api.ProblemDetails;

/// <summary>Attaches ADR 0088 draft CAS codes onto Conflict ProblemDetails (LW-014).</summary>
internal static class DraftPatchCasConflictProblemExtensions
{
    internal static string ResolveTitle(ConflictException ex)
    {
        ArgumentNullException.ThrowIfNull(ex);

        if (string.Equals(ex.Code, DraftPatchCasConflictCodes.TokenMissing, StringComparison.Ordinal))
        {
            return "Draft CAS token missing";
        }

        if (string.Equals(ex.Code, DraftPatchCasConflictCodes.Stale, StringComparison.Ordinal))
        {
            return "Draft CAS stale";
        }

        return "Conflict";
    }

    internal static void AttachCode(Microsoft.AspNetCore.Mvc.ProblemDetails problem, ConflictException ex)
    {
        ArgumentNullException.ThrowIfNull(problem);
        ArgumentNullException.ThrowIfNull(ex);

        if (string.IsNullOrWhiteSpace(ex.Code))
        {
            return;
        }

        problem.Extensions["errorCode"] = ex.Code;
        problem.Extensions["code"] = ex.Code;
    }
}
