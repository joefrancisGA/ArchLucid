using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Security;

internal sealed class ProvisionedRuntimeTelemetryAuthority(
    IConfiguration config, IHttpContextAccessor http, ICentralAuthorizationDecisions decisions,
    IAzureInventorySnapshotRepository inventory, TimeProvider clock,
    ITrustedWorkerIdentity workerIdentity, IRuntimeAttestationPublicationAuthority publicationAuthority)
    : IRuntimeTelemetryReadAuthority
{
    public async Task<bool> CanReadAsync(RuntimeObservationRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!RuntimeTelemetryProvisioning.Enabled(config)) return false;
        var context = http.HttpContext;
        var principal = context?.User;
        // Never fall back to a worker identity for an HTTP request, even if anonymous.

        if (context is null)
        {
            principal = await workerIdentity.ResolveAsync(cancellationToken);

            if (principal?.Identity?.IsAuthenticated != true ||
                !await publicationAuthority.CanPublishAsync(request, cancellationToken)) return false;
        }

        if (principal?.Identity?.IsAuthenticated != true ||
            !Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["EvidenceRunId"], out var runId) ||
            runId == Guid.Empty ||
            !Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["InventorySnapshotId"], out var snapshotId) ||
            snapshotId == Guid.Empty)
            return false;
        var decision = await decisions.DecideAsync(principal,
            new("evidence.read", request.TenantId, request.WorkspaceId, request.ProjectId, runId),
            cancellationToken);

        if (!decision.Allowed) return false;
        var scope = new ScopeContext { TenantId = request.TenantId, WorkspaceId = request.WorkspaceId, ProjectId = request.ProjectId };
        var detail = await inventory.TryGetCanonicalSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (detail is null || detail.Header is not { } header ||
            header.SnapshotId != snapshotId || header.TenantId != request.TenantId ||
            header.WorkspaceId != request.WorkspaceId || header.ProjectId != request.ProjectId ||
            header.CapturedUtc is not DateTime captured || captured.Kind != DateTimeKind.Utc ||
            captured > clock.GetUtcNow().UtcDateTime || clock.GetUtcNow().UtcDateTime - captured > TimeSpan.FromHours(24) ||
            detail.Resources.Count(row => row.TenantId == request.TenantId && row.SnapshotId == snapshotId &&
                string.Equals(row.AzureResourceId, request.ResourceId, StringComparison.OrdinalIgnoreCase)) != 1)
            return false;
        cancellationToken.ThrowIfCancellationRequested();

        if (context is null && !await publicationAuthority.CanPublishAsync(request, cancellationToken)) return false;
        return RuntimeTelemetryProvisioning.Enabled(config) &&
            Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["EvidenceRunId"], out var current)
            && current == runId &&
            Guid.TryParse(RuntimeTelemetryProvisioning.Scope(config, request)["InventorySnapshotId"], out var currentSnapshot)
            && currentSnapshot == snapshotId;
    }
}
