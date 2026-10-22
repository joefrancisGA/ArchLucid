using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Telemetry;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

using ArchLucid.Api.Security;

public sealed partial class ClientErrorTelemetryController
{
    /// <summary>
    ///     Records one first-tenant onboarding funnel event (Improvement 12). Server infers the
    ///     tenant id from request scope; the body carries only the event name. Default emission is
    ///     aggregated-only (no <c>tenant_id</c> tag, no SQL row); per-tenant emission is gated by the
    ///     owner-only flag <c>Telemetry:FirstTenantFunnel:PerTenantEmission</c>.
    /// </summary>
    [HttpPost("first-tenant-funnel")]
    [EnableRateLimiting("registration")]
    [AllowAnonymous]
    [AllowUnscopedRoute]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostFirstTenantFunnelEvent(
        [FromBody] FirstTenantFunnelEventRequest? body,
        CancellationToken ct)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Event))
            return this.BadRequestProblem(
                "event is required.",
                ProblemTypes.ValidationFailed);

        string eventName = body.Event.Trim();

        if (!FirstTenantFunnelEventNames.IsValid(eventName))
            return this.BadRequestProblem(
                $"event must be one of: {string.Join(", ", FirstTenantFunnelEventNames.All)}.",
                ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await _firstTenantFunnelEmitter.EmitAsync(eventName, scope.TenantId, ct);

        return NoContent();
    }

    /// <summary>
    ///     Records one Core Pilot first-session checklist step from the operator UI (Improvement QA-2026-05-01). Aggregated
    ///     counter only — safe for anonymous calls with rate limiting.
    /// </summary>
    [HttpPost("core-pilot-rail-step")]
    [EnableRateLimiting("registration")]
    [AllowAnonymous]
    [AllowUnscopedRoute]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult PostCorePilotRailChecklistStep([FromBody] CorePilotRailStepRequest? body)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        if (body.StepIndex is < 0 or > 3)
            return this.BadRequestProblem(
                "stepIndex must be between 0 and 3 inclusive (Core Pilot checklist).",
                ProblemTypes.ValidationFailed);

        ArchLucidInstrumentation.RecordCorePilotRailChecklistStep(body.StepIndex);

        return NoContent();
    }
}
