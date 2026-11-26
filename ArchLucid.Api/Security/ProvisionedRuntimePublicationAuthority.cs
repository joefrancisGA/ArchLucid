using System.Security.Claims;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Security;

/// <summary>Publication requires an independently authenticated worker and an explicit
/// administrator-provisioned grant for the exact runtime scope. Read grants are not
/// sufficient. The default trusted-worker identity provider denies all requests.</summary>
internal sealed class ProvisionedRuntimePublicationAuthority(
    IConfiguration config, ITrustedWorkerIdentity identities,
    ICentralAuthorizationDecisions decisions, ICentralAuthorizationAudit audit, TimeProvider clock)
    : IRuntimeAttestationPublicationAuthority
{
    public async Task<bool> CanPublishAsync(RuntimeObservationRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        try
        {
            if (request.TenantId == Guid.Empty || request.WorkspaceId == Guid.Empty ||
                request.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(request.ResourceId) ||
                string.IsNullOrWhiteSpace(request.DeploymentGeneration) ||
                string.IsNullOrWhiteSpace(request.RuntimeFamily))
                return false;

            var principal = await identities.ResolveAsync(ct);
            if (principal?.Identity?.IsAuthenticated != true) return false;
            var identity = principal.Identity as ClaimsIdentity;
            if (identity is null) return false;
            var subjects = identity.FindAll(ClaimTypes.NameIdentifier).ToArray();
            if (subjects.Length != 1 || string.IsNullOrWhiteSpace(subjects[0].Value) ||
                string.IsNullOrWhiteSpace(subjects[0].Issuer)) return false;

            bool Grant(out Guid runId)
            {
                var provision = RuntimeTelemetryProvisioning.Scope(config, request);
                runId = Guid.Empty;
                return RuntimeTelemetryProvisioning.Enabled(config) &&
                    bool.TryParse(provision["Publication:Enabled"], out var enabled) && enabled &&
                    string.Equals(provision["Publication:Subject"], subjects[0].Value, StringComparison.Ordinal) &&
                    string.Equals(provision["Publication:Issuer"], subjects[0].Issuer, StringComparison.Ordinal) &&
                    Guid.TryParse(provision["EvidenceRunId"], out runId) && runId != Guid.Empty;
            }

            if (!Grant(out var run)) return false;
            // Existing central gate establishes current server-side run entitlement and audit.
            // The separate publication grant is mandatory in addition to that read decision.
            var decision = await decisions.DecideAsync(principal,
                new("evidence.read", request.TenantId, request.WorkspaceId, request.ProjectId, run), ct);
            if (!decision.Allowed || !Grant(out var current) || current != run) return false;
            await audit.WriteAsync(new(Guid.NewGuid(), "runtime.telemetry.publish",
                request.TenantId, request.WorkspaceId, request.ProjectId, run, true,
                "explicit_scoped_producer_grant", "trusted-worker", clock.GetUtcNow()), ct);
            ct.ThrowIfCancellationRequested();
            return Grant(out current) && current == run;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) { return false; }
    }
}
