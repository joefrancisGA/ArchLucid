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
        // AuditService replaces ActorUserId with NameIdentifier unless ExplicitActor is set.
        string actorUserId = actorContext.GetActorId();
        string actorUserName = actorContext.GetActor();
        byte[] keyHash = ArchitectureRunIdempotencyHashing.HashIdempotencyKey(idempotencyKey);
        Guid? auditRunId = TryParseArchitectureRunIdForAudit(request.RunId);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.GovernanceApprovalRequested,
                ExplicitActor = true,
                ActorUserId = actorUserId,
                ActorUserName = actorUserName,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId = auditRunId?.ToString("D"),
                    idempotencyKeySha256Hex = Convert.ToHexString(keyHash),
                    manifestVersion = request.ManifestVersion?.Trim(),
                    sourceEnvironment = request.SourceEnvironment?.Trim(),
                    targetEnvironment = request.TargetEnvironment?.Trim(),
                    requestedBy = actorUserName,
                    requestedByActorKey = actorUserId,
                })
            },
            cancellationToken);
    }

    private static Guid? TryParseArchitectureRunIdForAudit(string runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return null;

        string normalizedRunId = GovernanceRunIdNormalizer.Normalize(runId);

        if (normalizedRunId.Length == 0)
            return null;

        if (Guid.TryParseExact(normalizedRunId, "N", out Guid g))
            return g;

        return Guid.TryParse(normalizedRunId, out g) ? g : null;
    }
}
