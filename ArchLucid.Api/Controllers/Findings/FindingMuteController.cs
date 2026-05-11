using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Findings;

/// <summary>Scopes a relational mute to the findings snapshot row for one authority run.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/findings")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class FindingMuteController(
    IFindingRecordMuteRepository findingRecordMuteRepository,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly IFindingRecordMuteRepository _findingRecordMuteRepository =
        findingRecordMuteRepository ?? throw new ArgumentNullException(nameof(findingRecordMuteRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Mutes a finding for the given run (hides from default operator lists until un-muted).</summary>
    [HttpPost("{findingId}/mute")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostMuteAsync(string findingId, [FromBody] FindingMuteRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        string trimmedId = findingId.Trim();

        if (trimmedId.Length > 64)
            return this.BadRequestProblem("Finding id exceeds maximum length (64).", ProblemTypes.ValidationFailed);

        if (request.RunId == Guid.Empty)
            return this.BadRequestProblem("Run id is required.", ProblemTypes.ValidationFailed);

        string reason = request.Reason ?? string.Empty;

        if (string.IsNullOrWhiteSpace(reason))
            return this.BadRequestProblem("Reason is required.", ProblemTypes.ValidationFailed);

        if (reason.Length > 2000)
            return this.BadRequestProblem("Reason exceeds maximum length (2000).", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        bool updated = await _findingRecordMuteRepository.TryMuteAsync(
            request.RunId,
            trimmedId,
            reason.Trim(),
            scope,
            ct);

        if (!updated)
            return this.NotFoundProblem(
                $"Finding '{trimmedId}' was not found for run '{request.RunId:D}' in the current scope, or cannot be muted.",
                ProblemTypes.ResourceNotFound);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingMuted,
                RunId = request.RunId,
                DataJson = JsonSerializer.Serialize(new { findingId = trimmedId, reason = reason.Trim() })
            },
            ct);

        return NoContent();
    }
}
