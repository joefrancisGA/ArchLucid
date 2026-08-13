using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Http;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;


namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    private (IActionResult? Error, string? TrimmedKey) ReadGovernanceIdempotencyKey(bool required)
    {
        if (!required)
            return (null, null);

        return GovernanceIdempotencyKeySupport.ReadRequired(this);
    }

    private async Task LogGovernanceApprovalRequestedAuditAsync(
        CreateGovernanceApprovalRequest request,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = actorContext.GetActor();
        byte[] keyHash = ArchitectureRunIdempotencyHashing.HashIdempotencyKey(idempotencyKey);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.GovernanceApprovalRequested,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = TryParseArchitectureRunIdForAudit(request.RunId),
                DataJson = JsonSerializer.Serialize(new
                {
                    idempotencyKeySha256Hex = Convert.ToHexString(keyHash),
                    manifestVersion = request.ManifestVersion,
                    sourceEnvironment = request.SourceEnvironment,
                    targetEnvironment = request.TargetEnvironment
                })
            },
            cancellationToken);
    }

    private static Guid? TryParseArchitectureRunIdForAudit(string runId)
    {
        if (Guid.TryParseExact(runId, "N", out Guid g))
            return g;

        return Guid.TryParse(runId, out g) ? g : null;
    }
}
