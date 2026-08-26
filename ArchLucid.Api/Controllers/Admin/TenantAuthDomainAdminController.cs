using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Tenant administration for verified sign-in email domains and SSO enforcement.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/identity/domains")]
public sealed partial class TenantAuthDomainAdminController(
    TenantAuthDomainAdminService adminService,
    IAuthSignInRoutingService routingService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    private readonly TenantAuthDomainAdminService _adminService =
        adminService ?? throw new ArgumentNullException(nameof(adminService));

    private readonly IAuthSignInRoutingService _routingService =
        routingService ?? throw new ArgumentNullException(nameof(routingService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpGet]
    [MutatingAuditExcluded("Read-only domain list.")]
    [ProducesResponseType(typeof(IReadOnlyList<TenantSignInEmailDomainRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<TenantSignInEmailDomainRecord> rows =
            await _adminService.ListDomainsAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(rows);
    }

    [HttpPost]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProposeAsync(
        [FromBody] TenantAuthDomainProposeRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Domain))
        {
            return this.BadRequestProblem("Domain is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record;

        try
        {
            record = await _adminService
                .ProposeDomainAsync(scope.TenantId, request.Domain, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainProposed,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { normalizedDomain = record.NormalizedDomain })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpDelete("{normalizedDomain}")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveDomainAsync(string normalizedDomain, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record =
            await _adminService.RemoveDomainAsync(scope.TenantId, normalizedDomain, cancellationToken)
                .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainRemoved,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { normalizedDomain = record.NormalizedDomain })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    private static TenantAuthDomainAdminResponse ToResponse(
        TenantSignInEmailDomainRecord record,
        TenantAuthDomainAdminService adminService) =>
        new()
        {
            Domain = record,
            DnsVerificationInstruction = adminService.BuildDnsVerificationInstruction(record)
        };
}

public sealed class TenantAuthDomainProposeRequest
{
    public string Domain
    {
        get;
        init;
    } = string.Empty;
}

public sealed class TenantAuthDomainRoutingTestRequest
{
    public string TestEmail
    {
        get;
        init;
    } = string.Empty;
}

public sealed class TenantAuthDomainEnforcementRequest
{
    public AuthDomainEnforcementMode EnforcementMode
    {
        get;
        init;
    }

    public bool AllowEmailOtpRecovery
    {
        get;
        init;
    }
}

public sealed class TenantAuthDomainEnableEnforcementRequest
{
    public bool ConfirmTested
    {
        get;
        init;
    }
}

public sealed class TenantAuthDomainRecoveryAdminRequest
{
    public string Email
    {
        get;
        init;
    } = string.Empty;
}

public sealed class TenantAuthDomainAdminResponse
{
    public TenantSignInEmailDomainRecord Domain
    {
        get;
        init;
    } = null!;

    public string DnsVerificationInstruction
    {
        get;
        init;
    } = string.Empty;
}

public sealed class AuthSignInRoutingPreviewResponse
{
    public bool AllowEmailCode
    {
        get;
        init;
    }

    public bool SsoRequired
    {
        get;
        init;
    }

    public string? Message
    {
        get;
        init;
    }
}
