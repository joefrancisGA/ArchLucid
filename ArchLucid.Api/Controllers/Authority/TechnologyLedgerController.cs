using System.Text.Json;

using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models.TechnologyLedger;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     HTTP API for reading and curating per-run Technology Ledger entries (operator baseline review).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/runs")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class TechnologyLedgerController(
    ITechnologyLedgerRunCommandService technologyLedgerRunCommandService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    /// <summary>Returns all Technology Ledger entries for <paramref name="runId" />.</summary>
    [HttpGet("{runId:guid}/technology-ledger")]
    [ProducesResponseType(typeof(TechnologyLedgerListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTechnologyLedger(
        [FromRoute] Guid runId,
        CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            IReadOnlyList<TechnologyLedgerEntry> entries =
                await technologyLedgerRunCommandService.GetByRunIdAsync(scope, runId, cancellationToken);

            TechnologyLedgerListResponse response = new()
            {
                RunId = runId.ToString("N"),
                Entries = entries.Select(TechnologyLedgerEntryMapper.ToResponse).ToList(),
            };

            return Ok(response);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    /// <summary>Updates approval fields on a single Technology Ledger entry.</summary>
    [HttpPatch("{runId:guid}/technology-ledger/{entryId}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(PatchTechnologyLedgerEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PatchTechnologyLedgerEntry(
        [FromRoute] Guid runId,
        [FromRoute] string entryId,
        [FromBody] PatchTechnologyLedgerEntryRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null || !request.HasChanges())
            return this.BadRequestProblem("At least one patch field must be provided.", ProblemTypes.ValidationFailed);

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            PatchTechnologyLedgerEntryCommand command = new()
            {
                Status = request.Status,
                IsLocked = request.IsLocked,
                Rationale = request.Rationale,
                TechnologyName = request.TechnologyName,
                ProviderFamily = request.ProviderFamily,
            };

            TechnologyLedgerEntry updated = await technologyLedgerRunCommandService.PatchEntryAsync(
                scope,
                runId,
                entryId,
                command,
                cancellationToken);

            string auditActor = actorContext.GetActor();

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TechnologyLedgerEntryUpdated,
                    ActorUserId = auditActor,
                    ActorUserName = auditActor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = runId,
                    CorrelationId = HttpContext.TraceIdentifier,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            entryId = updated.EntryId,
                            role = updated.Role.ToString(),
                            status = updated.Status.ToString(),
                            isLocked = updated.IsLocked,
                        },
                        AuditJsonSerializationOptions.Instance),
                },
                cancellationToken);

            PatchTechnologyLedgerEntryResponse response = new()
            {
                Entry = TechnologyLedgerEntryMapper.ToResponse(updated),
            };

            return Ok(response);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (TechnologyLedgerEntryNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (TechnologyLedgerPatchValidationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
