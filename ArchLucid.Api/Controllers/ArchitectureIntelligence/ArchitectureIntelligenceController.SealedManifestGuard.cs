using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.ArchitectureIntelligence;

public sealed partial class ArchitectureIntelligenceController
{
    private async Task<IActionResult?> EnsureArchitectureIntelligenceRunCreateSealedManifestAllowedAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await DraftIntakeSealedManifestReadGuard.EnsureDraftIntakeReadAllowedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                _runDetailQueryService,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken,
                canReadRun: async (runId, ct) =>
                {
                    (bool found, bool canRead) = await _architectureShareAccessGate.EvaluateRunReadAsync(User, scope, runId, ct);
                    return found && canRead;
                });
        }
        catch (ConflictException ex)
        {
            return MapArchitectureIntelligenceSealedManifestConflict(ex);
        }

        return null;
    }

    // Product runs use architecture sharing. A standalone run must instead have a
    // server-issued binding for this actor and the exact authenticated scope.
    private async Task<IActionResult?> EnsureRunSealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid runId,
        bool requireDecide,
        CancellationToken cancellationToken,
        bool allowStandalone = true)
    {
        (bool found, bool canRead) = await _architectureShareAccessGate.EvaluateRunReadAsync(
            User, scope, runId, cancellationToken);

        if (!found)
        {
            string? actorId = allowStandalone ? GetStandaloneRunActorId() : null;
            if (actorId is not null
                && await _standaloneRunStore.IsOwnedByAsync(scope, runId, actorId, cancellationToken))
            {
                return null;
            }

            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(this, runId);
        }

        if (!canRead)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(this, runId);

        if (requireDecide)
        {
            IActionResult? decideDenied = await _architectureShareAccessGate.EnsureRunDecideAllowedAsync(
                this, User, scope, runId, cancellationToken);

            if (decideDenied is not null)
                return decideDenied;
        }

        RunDetailDto? detail = await _authorityQueryService.GetRunDetailForManifestCompareAsync(
            scope, runId, cancellationToken);
        if (detail is null)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(this, runId);

        if (detail.Run.GoldenManifestId.HasValue || detail.GoldenManifest is not null
            || string.Equals(detail.Run.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
        {
            GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrow(
                detail.GoldenManifest, runId.ToString("D"), _manifestHashService);
        }

        return null;
    }

    private string? GetStandaloneRunActorId()
    {
        if (User.Identity is not ClaimsIdentity { IsAuthenticated: true } identity)
            return null;

        // API keys identify a configured service principal. A display name from a
        // bearer or SAML identity is not a unique ownership key.
        if (identity.AuthenticationType == AuthServiceCollectionExtensions.ApiKeySchemeName)
            return string.IsNullOrWhiteSpace(identity.Name) ? null : JsonSerializer.Serialize(new[] { "api-key", identity.Name });

        Claim? objectId = identity.FindFirst("oid")
            ?? identity.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier");
        if (!string.IsNullOrWhiteSpace(objectId?.Value))
        {
            return JsonSerializer.Serialize(new[]
            {
                "object", identity.FindFirst("iss")?.Value ?? objectId.Issuer,
                identity.FindFirst("tid")?.Value ?? string.Empty, objectId.Value,
            });
        }

        Claim? subject = identity.FindFirst("sub") ?? identity.FindFirst(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(subject?.Value)
            ? null
            : JsonSerializer.Serialize(new[] { "subject", identity.FindFirst("iss")?.Value ?? subject.Issuer, subject.Value });
    }

    /// <summary>
    ///     Maps architecture-intelligence read/mutation <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapArchitectureIntelligenceSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
