using ArchLucid.Application;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Tenancy;

/// <inheritdoc cref="ITenantMigrationVerificationProbe" />
public sealed class TenantMigrationVerificationProbe(
    ITenantRepository tenantRepository,
    IReferenceEvidenceRunLookup referenceEvidenceRunLookup,
    IRunDetailQueryService runDetailQueryService) : ITenantMigrationVerificationProbe
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

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
            return new TenantMigrationVerificationProbeResult
            {
                Passed = false,
                ErrorMessage = "Tenant not found for verification probe.",
            };
        }

        IReadOnlyList<ReferenceEvidenceRunCandidate> committedRuns = await _referenceEvidenceRunLookup
            .ListRecentCommittedRunsAsync(tenantId, take: 1, includeDemo: false, cancellationToken)
            .ConfigureAwait(false);

        if (committedRuns.Count == 0)
        {
            return new TenantMigrationVerificationProbeResult
            {
                Passed = false,
                ErrorMessage = "No committed architecture review is available for read verification.",
            };
        }

        Guid probeRunGuid = committedRuns[0].RunId;
        string probeRunId = probeRunGuid.ToString("N");

        try
        {
            _ = await _runDetailQueryService
                .GetRunDetailForRollupAsync(probeRunId, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (RunNotFoundException)
        {
            return new TenantMigrationVerificationProbeResult
            {
                Passed = false,
                ProbeRunId = probeRunId,
                ErrorMessage = "Committed review could not be loaded from the target catalog.",
            };
        }

        return new TenantMigrationVerificationProbeResult
        {
            Passed = true,
            ProbeRunId = probeRunId,
        };
    }
}
