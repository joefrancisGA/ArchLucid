using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Audit;
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
public sealed class TenantAuthDomainAdminController(
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

    [HttpPost("{normalizedDomain}/verification/start")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> StartVerificationAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record = await _adminService
            .BeginVerificationAsync(scope.TenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainVerificationStarted,
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

    [HttpPost("{normalizedDomain}/verification/check")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckVerificationAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record = await _adminService
            .CheckVerificationAsync(scope.TenantId, normalizedDomain, cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainVerificationChecked,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        normalizedDomain = record.NormalizedDomain,
                        verificationStatus = record.VerificationStatus.ToString()
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpPost("{normalizedDomain}/routing/test")]
    [MutatingAuditExcluded("Routing preview only; no enforcement mutation.")]
    [ProducesResponseType(typeof(AuthSignInRoutingPreviewResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> TestRoutingAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainRoutingTestRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.TestEmail))
        {
            return this.BadRequestProblem("TestEmail is required.", ProblemTypes.ValidationFailed);
        }

        if (!IdentityEmailNormalizer.TryNormalize(request.TestEmail, out string normalizedEmail, out _))
        {
            return this.BadRequestProblem("Enter a valid test email address.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        AuthSignInRoutingEvaluation evaluation = await _routingService.EvaluateEnforcementPreviewAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = normalizedEmail },
            scope.TenantId,
            normalizedDomain,
            cancellationToken).ConfigureAwait(false);

        return Ok(
            new AuthSignInRoutingPreviewResponse
            {
                SsoRequired = evaluation.SsoRequired,
                AllowEmailCode = evaluation.AllowEmailCode,
                Message = evaluation.SsoRequired ? evaluation.CustomerMessage : null
            });
    }

    [HttpPost("{normalizedDomain}/routing/mark-tested")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkRoutingTestedAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainRoutingTestRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.TestEmail))
        {
            return this.BadRequestProblem("TestEmail is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record;

        try
        {
            record = await _adminService
                .MarkRoutingTestPassedAsync(
                    scope.TenantId,
                    normalizedDomain,
                    request.TestEmail,
                    cancellationToken)
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
                EventType = AuditEventTypes.AuthSignInRoutingEvaluated,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { normalizedDomain = record.NormalizedDomain, routingTestPassed = true })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpPut("{normalizedDomain}/enforcement")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetEnforcementAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainEnforcementRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record;

        try
        {
            record = await _adminService
                .SetEnforcementModeAsync(
                    scope.TenantId,
                    normalizedDomain,
                    request.EnforcementMode,
                    request.AllowEmailOtpRecovery,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthDomainEnforcementModeChanged,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        normalizedDomain = record.NormalizedDomain,
                        enforcementMode = record.EnforcementMode.ToString(),
                        allowEmailOtpRecovery = record.AllowEmailOtpRecovery
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpPost("{normalizedDomain}/enforcement/enable")]
    [ProducesResponseType(typeof(TenantAuthDomainAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> EnableEnforcementAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainEnableEnforcementRequest request,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecord record;

        try
        {
            record = await _adminService
                .EnableEnforcementAsync(
                    scope.TenantId,
                    normalizedDomain,
                    request?.ConfirmTested ?? false,
                    cancellationToken)
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
                EventType = AuditEventTypes.AuthDomainEnforcementEnabled,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        normalizedDomain = record.NormalizedDomain,
                        enforcementMode = record.EnforcementMode.ToString()
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ToResponse(record, _adminService));
    }

    [HttpGet("{normalizedDomain}/enforcement-readiness")]
    [MutatingAuditExcluded("Read-only enforcement readiness checklist.")]
    [ProducesResponseType(typeof(TenantAuthDomainEnforcementReadiness), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEnforcementReadinessAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        try
        {
            TenantAuthDomainEnforcementReadiness readiness = await _adminService
                .GetEnforcementReadinessAsync(scope.TenantId, normalizedDomain, cancellationToken)
                .ConfigureAwait(false);

            return Ok(readiness);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpGet("{normalizedDomain}/recovery-admins")]
    [MutatingAuditExcluded("Read-only recovery administrator list.")]
    [ProducesResponseType(typeof(IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRecoveryAdminsAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord> rows =
            await _adminService.ListRecoveryAdminsAsync(scope.TenantId, normalizedDomain, cancellationToken)
                .ConfigureAwait(false);

        return Ok(rows);
    }

    [HttpPost("{normalizedDomain}/recovery-admins")]
    [ProducesResponseType(typeof(TenantSignInEmailDomainRecoveryAdminRecord), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddRecoveryAdminAsync(
        string normalizedDomain,
        [FromBody] TenantAuthDomainRecoveryAdminRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Email))
        {
            return this.BadRequestProblem("Email is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantSignInEmailDomainRecoveryAdminRecord row;

        try
        {
            row = await _adminService
                .AddRecoveryAdminAsync(scope.TenantId, normalizedDomain, request.Email, actorId, cancellationToken)
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
                EventType = AuditEventTypes.AuthDomainRecoveryAdminAdded,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        normalizedDomain,
                        recoveryAdminEmail = row.NormalizedRecoveryAdminEmail
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(row);
    }

    [HttpDelete("{normalizedDomain}/recovery-admins/{normalizedRecoveryAdminEmail}")]
    [ProducesResponseType(typeof(TenantAuthDomainRecoveryAdminRemovalResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveRecoveryAdminAsync(
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        [FromQuery] bool confirmRemoveLast,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantAuthDomainRecoveryAdminRemovalResult result = await _adminService
            .TryRemoveRecoveryAdminAsync(
                scope.TenantId,
                normalizedDomain,
                normalizedRecoveryAdminEmail,
                confirmRemoveLast,
                cancellationToken)
            .ConfigureAwait(false);

        if (!result.Removed)
        {
            return Ok(result);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = result.WasLastRecoveryAdmin
                    ? AuditEventTypes.AuthDomainLastRecoveryPathRemoved
                    : AuditEventTypes.AuthDomainRecoveryAdminRemoved,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { normalizedDomain, recoveryAdminEmail = normalizedRecoveryAdminEmail })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(result);
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
