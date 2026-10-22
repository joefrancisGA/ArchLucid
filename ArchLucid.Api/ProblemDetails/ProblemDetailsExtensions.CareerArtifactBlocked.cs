using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.ProblemDetails;

public static partial class ProblemDetailsExtensions
{
    /// <summary>Returns 409 when ADR 0078 blocks a career export with named blockReason fields (FC-08).</summary>
    public static IActionResult CareerArtifactBlockedProblem(
        this ControllerBase controller,
        string detail,
        string? blockReasonCode = null,
        string? instance = null)
    {
        Dictionary<string, object?> extensions = new(StringComparer.Ordinal)
        {
            ["blockReason"] = detail,
        };

        if (!string.IsNullOrWhiteSpace(blockReasonCode))
        {
            extensions["blockReasonCode"] = blockReasonCode;
        }

        return controller.ConflictProblem(
            detail,
            ProblemTypes.CareerArtifactBlocked,
            instance,
            extensions);
    }
}
