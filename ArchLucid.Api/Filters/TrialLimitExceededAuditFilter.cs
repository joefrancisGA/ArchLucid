using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Mvc.Filters;

namespace ArchLucid.Api.Filters;

/// <summary>
/// Emits <see cref="ArchLucid.Core.Audit.AuditEventTypes.TrialLimitExceeded"/> when an MVC action throws
/// <see cref="TrialLimitExceededException"/> (for example from downstream services after authorization passed).
/// </summary>
public sealed class TrialLimitExceededAuditFilter : IAsyncExceptionFilter
{
    /// <inheritdoc />
    public Task OnExceptionAsync(ExceptionContext context)
    {
        if (context.Exception is not TrialLimitExceededException ex) return Task.CompletedTask;

        return TrialLimitProblemResponse.TryLogAuditAsync(context.HttpContext, ex, context.HttpContext.RequestAborted);
    }
}
