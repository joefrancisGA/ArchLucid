using ArchLucid.Application;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Tenancy;

/// <inheritdoc cref="ITenantMigrationVerificationProbe" />
public sealed class TenantMigrationVerificationProbe(
    ITenantRepository tenantRepository,
    ITenantIdentityProviderConfigurationRepository identityProviderConfigurationRepository,
    IReferenceEvidenceRunLookup referenceEvidenceRunLookup,
    IRunDetailQueryService runDetailQueryService) : ITenantMigrationVerificationProbe
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantIdentityProviderConfigurationRepository _identityProviderConfigurationRepository =
        identityProviderConfigurationRepository
        ?? throw new ArgumentNullException(nameof(identityProviderConfigurationRepository));

    private readonly IReferenceEvidenceRunLookup _referenceEvidenceRunLookup =
        referenceEvidenceRunLookup ?? throw new ArgumentNullException(nameof(referenceEvidenceRunLookup));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    public async Task<TenantMigrationVerificationProbeResult> RunAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
        {
            return Failed("Tenant not found for verification probe.");
        }

        if (tenant.SuspendedUtc is null)
        {
            return Failed("Tenant write freeze is not active — reopening writes before verification is unsafe.");
        }

        _ = await _identityProviderConfigurationRepository
            .TryGetAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<ReferenceEvidenceRunCandidate> committedRuns = await _referenceEvidenceRunLookup
            .ListRecentCommittedRunsAsync(tenantId, take: 1, includeDemo: false, cancellationToken)
            .ConfigureAwait(false);

        if (committedRuns.Count == 0)
        {
            return Failed("No committed architecture review is available for read verification.");
        }

        ReferenceEvidenceRunCandidate candidate = committedRuns[0];
        string probeRunId = candidate.RunId.ToString("N");

        if (candidate.WorkspaceId == Guid.Empty || candidate.ScopeProjectId == Guid.Empty)
        {
            return Failed(
                "Committed review is missing workspace or project scope required for authorization-boundary verification.",
                probeRunId);
        }

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = candidate.WorkspaceId,
            ProjectId = candidate.ScopeProjectId,
        };

        try
        {
            using (AmbientScopeContext.Push(scope))
            {
                ArchitectureRunDetail? detail = await _runDetailQueryService
                    .GetRunDetailForRollupAsync(probeRunId, cancellationToken)
                    .ConfigureAwait(false);

                if (detail is null)
                {
                    return Failed("Committed review could not be loaded from the target catalog.", probeRunId);
                }
            }
        }
        catch (RunNotFoundException)
        {
            return Failed("Committed review could not be loaded from the target catalog.", probeRunId);
        }

        return new TenantMigrationVerificationProbeResult
        {
            Passed = true,
            ProbeRunId = probeRunId,
            WriteFreezeVerified = true,
            AuthorizationBoundaryVerified = true,
        };
    }

    private static TenantMigrationVerificationProbeResult Failed(string message, string? probeRunId = null)
    {
        return new TenantMigrationVerificationProbeResult
        {
            Passed = false,
            ProbeRunId = probeRunId,
            ErrorMessage = message,
        };
    }
}
