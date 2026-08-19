using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Runtime Quick Scan safety kill switch (TB-898).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/quick-scan/safety")]
public sealed class AdminQuickScanSafetyController(
    IQuickScanSafetyOperationalAdminService adminService,
    IQuickScanSafetyOperationalStateStore store,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly IQuickScanSafetyOperationalAdminService _adminService =
        adminService ?? throw new ArgumentNullException(nameof(adminService));

    private readonly IQuickScanSafetyOperationalStateStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpGet]
    [ProducesResponseType(typeof(AdminQuickScanSafetySnapshotResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminQuickScanSafetySnapshotResponse>> GetAsync(CancellationToken cancellationToken)
    {
        AdminQuickScanSafetySnapshotResponse snapshot =
            await _adminService.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        return Ok(snapshot);
    }

    [HttpPut]
    [ProducesResponseType(typeof(AdminQuickScanSafetySnapshotResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PutAsync(
        [FromBody] AdminQuickScanSafetyUpdateRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        QuickScanSafetyOperationalOverrideRow? previous =
            await _store.GetOverrideAsync(cancellationToken).ConfigureAwait(false);

        QuickScanSafetyOperationalMode previousMode = previous?.Mode ?? QuickScanSafetyOperationalMode.Normal;
        string actor = User.Identity?.Name ?? "unknown";

        AdminQuickScanSafetySnapshotResponse snapshot;

        try
        {
            snapshot = await _adminService.SetOverrideAsync(request, actor, cancellationToken).ConfigureAwait(false);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        QuickScanSafetyOperationalMode newMode = Enum.Parse<QuickScanSafetyOperationalMode>(snapshot.OperationalMode, ignoreCase: true);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.QuickScanSafetyOperationalOverrideChanged,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = QuickScanSafetyOperationalAuditSerializer.SerializeChange(
                    previousMode,
                    newMode,
                    request.Reason,
                    actor),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(snapshot);
    }
}
