using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Runs;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Controllers.Governance;

internal static class GovernanceIdempotencyKeySupport
{
    internal static (IActionResult? Error, string? TrimmedKey) ReadRequired(ControllerBase controller)
    {
        if (!controller.Request.Headers.TryGetValue("Idempotency-Key", out StringValues raw) ||
            string.IsNullOrWhiteSpace(raw.ToString()))
        {
            return (controller.BadRequestProblem(
                "Idempotency-Key header is required for persisted governance mutations.",
                ProblemTypes.ValidationFailed), null);
        }

        string trimmed = raw.ToString().Trim();

        if (trimmed.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
        {
            return (controller.BadRequestProblem(
                $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.",
                ProblemTypes.ValidationFailed), null);
        }

        return (null, trimmed);
    }
}
