using ArchLucid.Api.Attributes;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class ArchitecturesController
{
    /// <summary>Lists architecture share grants and restrict-to-shares flag (AS-092).</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{architectureId:guid}/shares")]
    [ProducesResponseType(typeof(ArchitectureShareListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListShares(Guid architectureId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? shareGuardResult =
            await EnsureArchitectureShareReadAllowedAsync(scope, architectureId, cancellationToken);

        if (shareGuardResult is not null)
            return shareGuardResult;

        ArchitectureShareListResult result = await _architectureShareManagementService.GetSharesAsync(
            scope,
            architectureId,
            cancellationToken);

        if (result.Status == ArchitectureShareListStatus.ArchitectureNotFound)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(result.Response);
    }

    /// <summary>Grants or updates one architecture share row (AS-092).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPut("{architectureId:guid}/shares/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Audit: ArchitectureShareAuditSupport logs ArchitectureShareGranted via LogOrThrowAsync.")]
    public async Task<IActionResult> UpsertShare(
        Guid architectureId,
        Guid userId,
        [FromBody] UpsertArchitectureShareRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? adminGuardResult = await EnsureArchitectureShareAdminAllowedAsync(
            scope,
            architectureId,
            cancellationToken);

        if (adminGuardResult is not null)
            return adminGuardResult;

        ArchitectureShareUpsertResult result = await _architectureShareManagementService.UpsertShareAsync(
            scope,
            architectureId,
            userId,
            body.Role,
            _actorContext.GetActor(),
            cancellationToken);

        if (result.Status == ArchitectureShareUpsertStatus.ArchitectureNotFound)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureShareUpsertStatus.InvalidRole)
        {
            return this.BadRequestProblem(
                "Share role must be View, Decide, or Admin.",
                ProblemTypes.ValidationFailed);
        }

        if (result.Status == ArchitectureShareUpsertStatus.ScimGroupNotSupported)
        {
            return this.BadRequestProblem(
                "Architecture shares must target workspace users, not SCIM groups.",
                ProblemTypes.ValidationFailed);
        }

        if (result.Status == ArchitectureShareUpsertStatus.UserNotFound)
        {
            return this.BadRequestProblem(
                "Share target must be an existing workspace user.",
                ProblemTypes.ValidationFailed);
        }

        await _architectureShareAuditSupport.LogShareGrantedAsync(
            scope,
            _actorContext.GetActor(),
            architectureId,
            userId,
            body.Role,
            cancellationToken);

        return NoContent();
    }

    /// <summary>Revokes one architecture share row (AS-092).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpDelete("{architectureId:guid}/shares/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [MutatingAuditExcluded("Audit: ArchitectureShareAuditSupport logs ArchitectureShareRevoked via LogOrThrowAsync.")]
    public async Task<IActionResult> DeleteShare(
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? adminGuardResult = await EnsureArchitectureShareAdminAllowedAsync(
            scope,
            architectureId,
            cancellationToken);

        if (adminGuardResult is not null)
            return adminGuardResult;

        ArchitectureShareDeleteResult result = await _architectureShareManagementService.DeleteShareAsync(
            scope,
            architectureId,
            userId,
            cancellationToken);

        if (result.Status == ArchitectureShareDeleteStatus.ArchitectureNotFound)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureShareDeleteStatus.ShareNotFound)
        {
            return this.NotFoundProblem(
                $"Share for user '{userId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        await _architectureShareAuditSupport.LogShareRevokedAsync(
            scope,
            _actorContext.GetActor(),
            architectureId,
            userId,
            cancellationToken);

        return NoContent();
    }

    private async Task<IActionResult?> EnsureArchitectureShareAdminAllowedAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        PlatformUserRecord? platformUser = await _platformUserResolver.ResolveAsync(User, cancellationToken);

        ArchitectureShareAccessEvaluation access = await _architectureShareAccessService.EvaluateAsync(
            scope,
            architectureId,
            platformUser?.Id,
            ArchitectureShareAuthorityProbe.HasReadAuthority(User),
            ArchitectureShareAuthorityProbe.HasExecuteAuthority(User),
            ArchitectureShareAuthorityProbe.HasWorkspaceAdminAuthority(User),
            cancellationToken);

        if (!access.ArchitectureFound || !access.CanAdmin)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return null;
    }
}
