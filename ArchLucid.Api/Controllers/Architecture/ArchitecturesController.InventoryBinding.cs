using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class ArchitecturesController
{
    /// <summary>Gets the current Azure inventory snapshot binding for an architecture identity.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{architectureId:guid}/inventory-binding")]
    [ProducesResponseType(typeof(ArchitectureInventoryBindingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetInventoryBinding(Guid architectureId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ArchitectureInventoryBindingResponse? binding = await _architectureInventoryBindingService.TryGetBindingAsync(
            scope,
            architectureId,
            cancellationToken);

        if (binding is null)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(binding);
    }

    /// <summary>Attaches an existing Azure inventory snapshot to an architecture identity.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPost("{architectureId:guid}/inventory-binding")]
    [ProducesResponseType(typeof(ArchitectureInventoryBindingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AttachInventoryBinding(
        Guid architectureId,
        [FromBody] AttachArchitectureInventoryBindingRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.SnapshotId == Guid.Empty)
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? sealedGuardResult =
            await EnsureArchitectureIdentityMutationSealedManifestAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        ArchitectureInventoryBindingAttachResult attachResult = await _architectureInventoryBindingService.AttachAsync(
            scope,
            architectureId,
            body.SnapshotId,
            _actorContext.GetActor(),
            cancellationToken);

        if (attachResult.Status == ArchitectureInventoryBindingAttachStatus.ArchitectureNotFound)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (attachResult.Status == ArchitectureInventoryBindingAttachStatus.SnapshotNotFound)
        {
            return this.NotFoundProblem(
                $"Inventory snapshot '{body.SnapshotId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        await _auditService.LogAsync(
            BuildArchitectureAuditEvent(
                scope,
                AuditEventTypes.ArchitectureInventorySnapshotBound,
                new
                {
                    architectureId,
                    snapshotId = body.SnapshotId,
                }),
            cancellationToken);

        return Ok(attachResult.Response);
    }

    /// <summary>Detaches the Azure inventory snapshot from an architecture identity.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpDelete("{architectureId:guid}/inventory-binding")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DetachInventoryBinding(Guid architectureId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? sealedGuardResult =
            await EnsureArchitectureIdentityMutationSealedManifestAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        ArchitectureInventoryBindingResponse? existing = await _architectureInventoryBindingService.TryGetBindingAsync(
            scope,
            architectureId,
            cancellationToken);

        if (existing is null)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        bool detached = await _architectureInventoryBindingService.TryDetachAsync(
            scope,
            architectureId,
            cancellationToken);

        if (!detached)
            return NoContent();

        await _auditService.LogAsync(
            BuildArchitectureAuditEvent(
                scope,
                AuditEventTypes.ArchitectureInventorySnapshotDetached,
                new { architectureId }),
            cancellationToken);

        return NoContent();
    }
}
