using ArchLucid.Api.Attributes;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.ProblemDetails;
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
    /// <summary>Opt in or out of restrict-to-shares for an architecture identity (ADR 0087 / AS-089).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPut("{architectureId:guid}/restrict-to-shares")]
    [ProducesResponseType(typeof(ArchitectureRestrictToSharesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: AS-093 will co-commit Required durable audit for share mutations.")]
    public async Task<IActionResult> SetRestrictToShares(
        Guid architectureId,
        [FromBody] SetArchitectureRestrictToSharesRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? sealedGuardResult =
            await EnsureArchitectureIdentityMutationSealedManifestAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        Guid actorUserId = Guid.Empty;

        if (body.RestrictToShares)
        {
            PlatformUserRecord? platformUser = await _platformUserResolver.ResolveAsync(User, cancellationToken);

            if (platformUser is null)
            {
                return this.BadRequestProblem(
                    "A signed-in platform user is required to restrict an architecture to shares.",
                    ProblemTypes.ValidationFailed);
            }

            actorUserId = platformUser.Id;
        }

        ArchitectureRestrictToSharesSetResult result = await _architectureRestrictToSharesService.SetAsync(
            scope,
            architectureId,
            body.RestrictToShares,
            body.ConfirmOptIn,
            actorUserId,
            _actorContext.GetActorId(),
            cancellationToken);

        if (result.Status == ArchitectureRestrictToSharesSetStatus.ArchitectureNotFound)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        if (result.Status == ArchitectureRestrictToSharesSetStatus.ConfirmationRequired)
        {
            return this.BadRequestProblem(
                ArchitectureRestrictToSharesCopy.OptInConfirmation,
                ProblemTypes.ValidationFailed);
        }

        if (result.Status == ArchitectureRestrictToSharesSetStatus.ActorUserRequired)
        {
            return this.BadRequestProblem(
                "A signed-in platform user is required to restrict an architecture to shares.",
                ProblemTypes.ValidationFailed);
        }

        return Ok(result.Response);
    }
}
