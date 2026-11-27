using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Core.Agents;
using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AdminAgentModelCatalogController
{
    /// <summary>Records platform approval for a temporary, version-specific quarantine override or its removal.</summary>
    [HttpPut("provider-quality/override")]
    [Authorize(Roles = ArchLucidRoles.PlatformOperator)]
    [AllowUnscopedRoute]
    [ApiExplorerSettings(IgnoreApi = true)]
    [MutatingAuditExcluded("Audit: durable platform override intent is appended before the provider state can change.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PutProviderQualityOverrideAsync(
        [FromBody] ProviderQualityOverrideRequest? request,
        [FromServices] IProviderQualityMonitor monitor,
        [FromServices] IPlatformAuditRepository platformAudit,
        CancellationToken cancellationToken)
    {
        if (!User.IsInRole(ArchLucidRoles.PlatformOperator)
            || User.Identity?.IsAuthenticated != true)
            return Forbid();

        // Never let the ambient platform audit connection route this global action into a tenant catalog.
        if (_scopeContextProvider.GetCurrentScope().TenantId != Guid.Empty)
            return Forbid();

        string? actor = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(actor) || actor.Length > 200)
            return Forbid();

        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        string? reason = request.Reason?.Trim();
        if (request.Allow is null
            || !IsOverrideKeyPart(request.ProviderId) || !IsOverrideKeyPart(request.ModelId)
            || !IsOverrideKeyPart(request.ModelVersion) || reason is not { Length: >= 1 and <= 500 }
            || !UnicodeTextValidation.IsValidUnicodeText(reason)
            || (request.Allow == true && request.DurationMinutes is not (>= 1 and <= 60))
            || (request.Allow == false && request.DurationMinutes is not null))
        {
            return this.BadRequestProblem(
                "Supply a provider, model, version, decision and reason. An override must expire in 1 to 60 minutes.",
                ProblemTypes.ValidationFailed);
        }
        ProviderQualityKey key = ProviderQualityKey.Create(request.ProviderId, request.ModelId, request.ModelVersion);
        PlatformAuditEvent audit = new()
        {
            EventType = "AiProviderQualityOverrideRequested",
            ActorUserId = actor,
            ActorUserName = actor,
            SubjectTenantId = Guid.Empty,
            CorrelationId = HttpContext.TraceIdentifier,
            DataJson = JsonSerializer.Serialize(new
            {
                key.ProviderId,
                key.ModelId,
                key.ModelVersion,
                request.Allow,
                request.DurationMinutes,
                Reason = reason,
            }),
        };
        await platformAudit.AppendAsync(audit, cancellationToken).ConfigureAwait(false);

        TimeSpan? duration = request.DurationMinutes is { } minutes ? TimeSpan.FromMinutes(minutes) : null;
        bool updated = await monitor.SetOperatorOverrideAsync(key, duration, audit.EventId, cancellationToken)
            .ConfigureAwait(false);
        return updated
            ? NoContent()
            : this.ConflictProblem("The exact provider version is not quarantined.", ProblemTypes.Conflict);
    }

    private static bool IsOverrideKeyPart(string? value) =>
        value is { Length: >= 1 and <= 200 } && !string.IsNullOrWhiteSpace(value)
        && UnicodeTextValidation.IsValidUnicodeText(value)
        && !string.Equals(value.Trim(), "unknown", StringComparison.OrdinalIgnoreCase);

    public sealed record ProviderQualityOverrideRequest(
        string? ProviderId, string? ModelId, string? ModelVersion, bool? Allow, int? DurationMinutes, string? Reason);
}
