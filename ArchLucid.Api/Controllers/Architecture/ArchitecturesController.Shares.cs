using ArchLucid.Api.Attributes;
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
    /// <summary>Lists architecture-scoped shares for the current actor when they hold Admin on a restricted package.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{architectureId:guid}/shares")]
    [ProducesResponseType(typeof(ArchitectureShareListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ListArchitectureShares(Guid architectureId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actorOid = _actorContext.GetActorId();

        ArchitectureShareListResponse? response = await _architectureShareService.TryListSharesAsync(
            scope,
            architectureId,
            actorOid,
            cancellationToken);

        if (response is null)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(response);
    }

    /// <summary>Grants or updates one architecture-scoped share for a workspace user oid.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPut("{architectureId:guid}/shares")]
    [ProducesResponseType(typeof(ArchitectureShareListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: ArchitectureShareAuditSupport logs ArchitectureShareGranted via LogOrThrowAsync.")]
    public async Task<IActionResult> PutArchitectureShare(
        Guid architectureId,
        [FromBody] PutArchitectureShareRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? sealedGuardResult =
            await EnsureArchitectureIdentityMutationSealedManifestAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        string actor = _actorContext.GetActor();
        string actorOid = _actorContext.GetActorId();

        ArchitectureShareMutationResult result = await _architectureShareService.PutShareAsync(
            scope,
            architectureId,
            body,
            actor,
            actorOid,
            cancellationToken);

        if (result.Status == ArchitectureShareMutationStatus.ArchitectureNotFound)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureShareMutationStatus.NotAuthorized)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureShareMutationStatus.ValidationFailed)
        {
            return this.BadRequestProblem(result.ValidationMessage!, ProblemTypes.ValidationFailed);
        }

        await _architectureShareAuditSupport.LogShareGrantedAsync(
            scope,
            actor,
            architectureId,
            body.ActorOid,
            body.Role,
            cancellationToken);

        return Ok(result.Response);
    }

    /// <summary>Revokes one architecture-scoped share for a workspace user oid.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpDelete("{architectureId:guid}/shares/{targetActorOid}")]
    [ProducesResponseType(typeof(ArchitectureShareListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: ArchitectureShareAuditSupport logs ArchitectureShareRevoked via LogOrThrowAsync.")]
    public async Task<IActionResult> RevokeArchitectureShare(
        Guid architectureId,
        string targetActorOid,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? sealedGuardResult =
            await EnsureArchitectureIdentityMutationSealedManifestAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        string actor = _actorContext.GetActor();
        string actorOid = _actorContext.GetActorId();

        ArchitectureShareMutationResult result = await _architectureShareService.RevokeShareAsync(
            scope,
            architectureId,
            targetActorOid,
            actor,
            actorOid,
            cancellationToken);

        if (result.Status == ArchitectureShareMutationStatus.ArchitectureNotFound)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureShareMutationStatus.NotAuthorized)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureShareMutationStatus.ValidationFailed)
        {
            return this.BadRequestProblem(result.ValidationMessage!, ProblemTypes.ValidationFailed);
        }

        await _architectureShareAuditSupport.LogShareRevokedAsync(
            scope,
            actor,
            architectureId,
            targetActorOid,
            cancellationToken);

        return Ok(result.Response);
    }

    /// <summary>Enables or disables restrict-to-shares for one architecture identity.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPatch("{architectureId:guid}/restrict-to-shares")]
    [ProducesResponseType(typeof(ArchitectureShareListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: ArchitectureShareAuditSupport logs restrict-to-shares changes via LogOrThrowAsync.")]
    public async Task<IActionResult> PatchArchitectureRestrictToShares(
        Guid architectureId,
        [FromBody] PatchArchitectureRestrictToSharesRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? sealedGuardResult =
            await EnsureArchitectureIdentityMutationSealedManifestAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        string actor = _actorContext.GetActor();
        string actorOid = _actorContext.GetActorId();

        ArchitectureShareMutationResult result = await _architectureShareService.PatchRestrictToSharesAsync(
            scope,
            architectureId,
            body,
            actor,
            actorOid,
            cancellationToken);

        if (result.Status == ArchitectureShareMutationStatus.ArchitectureNotFound)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureShareMutationStatus.NotAuthorized)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureShareMutationStatus.ValidationFailed)
        {
            return this.BadRequestProblem(result.ValidationMessage!, ProblemTypes.ValidationFailed);
        }

        await _architectureShareAuditSupport.LogRestrictToSharesChangedAsync(
            scope,
            actor,
            architectureId,
            body.RestrictToShares,
            cancellationToken);

        return Ok(result.Response);
    }
}
