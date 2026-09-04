using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Models.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AdminAuthDiagnosticsController
{
    /// <summary>
    ///     Decodes a JWT payload without signature validation and evaluates role-claim mapping via
    ///     <see cref="ArchLucidRoleClaimsTransformation" />.
    /// </summary>
    [HttpPost("auth/diagnose-token")]
    [ProducesResponseType(typeof(AdminTokenClaimsDiagnosticResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DiagnoseTokenAsync(
        [FromBody] AdminTokenClaimsDiagnosticRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.BearerToken))
            return this.BadRequestProblem("BearerToken is required.", ProblemTypes.ValidationFailed);

        AdminTokenClaimsDiagnosticResponse response =
            await tokenClaimsDiagnosticService
                .DiagnoseAsync(request.BearerToken, cancellationToken)
                .ConfigureAwait(false);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "admin";

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthTokenDiagnosticRequested,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson =
                    $"{{\"resolvedRoleCount\":{response.ResolvedRoles.Count},\"unmappedValueCount\":{response.UnmappedValues.Count},\"warningCount\":{response.Warnings.Count}}}",
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(response);
    }
}
