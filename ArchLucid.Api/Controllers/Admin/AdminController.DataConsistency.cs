using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Pagination;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AdminController
{
    /// <summary>Detection-only orphan counts (same SQL as the background data-consistency probe).</summary>
    [HttpGet("diagnostics/data-consistency/orphans")]
    [ProducesResponseType(typeof(DataConsistencyOrphanCounts), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDataConsistencyOrphans(CancellationToken cancellationToken = default)
    {
        DataConsistencyOrphanCounts counts =
            await _diagnostics.GetDataConsistencyOrphanCountsAsync(cancellationToken);

        return Ok(counts);
    }

    /// <summary>Detection-only committed run header FK repoint counts (same SQL as the background probe).</summary>
    [HttpGet("diagnostics/data-consistency/header-repoints")]
    [ProducesResponseType(typeof(DataConsistencyHeaderRepointCounts), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDataConsistencyHeaderRepoints(CancellationToken cancellationToken = default)
    {
        DataConsistencyHeaderRepointCounts counts =
            await _diagnostics.GetDataConsistencyHeaderRepointCountsAsync(cancellationToken);

        return Ok(counts);
    }

    /// <summary>
    ///     Lists or deletes orphan <c>ComparisonRecords</c> whose run ids are missing from <c>dbo.Runs</c>.
    ///     Use <c>dryRun=true</c> first. Capped at <see cref="PaginationDefaults.MaxListingTake" /> rows per call.
    /// </summary>
    [HttpPost("diagnostics/data-consistency/orphan-comparison-records")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(OrphanComparisonRemediationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemediateOrphanComparisonRecords(
        [FromQuery] bool dryRun = true,
        [FromQuery] int maxRows = 50,
        CancellationToken cancellationToken = default)
    {
        OrphanComparisonRemediationResult result =
            await _diagnostics.RemediateOrphanComparisonRecordsAsync(dryRun, maxRows, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    ///     Lists or deletes orphan <c>dbo.GoldenManifests</c> (missing <c>dbo.Runs</c>), removing <c>dbo.ArtifactBundles</c>
    ///     first.
    ///     Use <c>dryRun=true</c> first. Capped at <see cref="PaginationDefaults.MaxListingTake" /> rows per call.
    /// </summary>
    [HttpPost("diagnostics/data-consistency/orphan-golden-manifests")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(OrphanGoldenManifestRemediationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemediateOrphanGoldenManifests(
        [FromQuery] bool dryRun = true,
        [FromQuery] int maxRows = 50,
        CancellationToken cancellationToken = default)
    {
        OrphanGoldenManifestRemediationResult result =
            await _diagnostics.RemediateOrphanGoldenManifestsAsync(dryRun, maxRows, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    ///     Lists or deletes orphan <c>dbo.FindingsSnapshots</c> (missing run, not referenced by a golden manifest).
    ///     Use <c>dryRun=true</c> first. Capped at <see cref="PaginationDefaults.MaxListingTake" /> rows per call.
    /// </summary>
    [HttpPost("diagnostics/data-consistency/orphan-findings-snapshots")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(OrphanFindingsSnapshotRemediationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemediateOrphanFindingsSnapshots(
        [FromQuery] bool dryRun = true,
        [FromQuery] int maxRows = 50,
        CancellationToken cancellationToken = default)
    {
        OrphanFindingsSnapshotRemediationResult result =
            await _diagnostics.RemediateOrphanFindingsSnapshotsAsync(dryRun, maxRows, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    ///     Detection-only count and sample of stale in-flight runs (Created / TasksGenerated / WaitingForResults /
    ///     Retrying older than 1 hour). Same predicate as reconciliation <c>stale_in_flight_runs</c>.
    /// </summary>
    [HttpGet("diagnostics/data-consistency/stale-in-flight-runs")]
    [ProducesResponseType(typeof(DataConsistencyStaleInFlightSnapshot), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDataConsistencyStaleInFlightRuns(
        [FromQuery] int maxSampleRows = 50,
        CancellationToken cancellationToken = default)
    {
        DataConsistencyStaleInFlightSnapshot snapshot =
            await _diagnostics.GetDataConsistencyStaleInFlightSnapshotAsync(maxSampleRows, cancellationToken);

        return Ok(snapshot);
    }

    /// <summary>
    ///     Lists or soft-archives stale in-flight runs. Prefer archive over Failed cancel when headers already hold
    ///     golden manifests / artifact bundles (<c>CK_Runs_FailedNoManifest</c>). Use <c>dryRun=true</c> first.
    ///     Capped at <see cref="PaginationDefaults.MaxListingTake" /> rows per call.
    /// </summary>
    [HttpPost("diagnostics/data-consistency/stale-in-flight-runs")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(StaleInFlightRemediationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemediateStaleInFlightRuns(
        [FromQuery] bool dryRun = true,
        [FromQuery] int maxRows = 50,
        CancellationToken cancellationToken = default)
    {
        StaleInFlightRemediationResult result =
            await _diagnostics.RemediateStaleInFlightRunsAsync(dryRun, maxRows, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    ///     Detection-only count and sample of runs whose ArchitectureRequestId is missing from
    ///     <c>dbo.ArchitectureRequests</c> (grace-aged; same predicate as auto-remediation).
    /// </summary>
    [HttpGet("diagnostics/data-consistency/missing-architecture-request-runs")]
    [ProducesResponseType(typeof(DataConsistencyMissingArchitectureRequestSnapshot), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDataConsistencyMissingArchitectureRequestRuns(
        [FromQuery] int maxSampleRows = 50,
        CancellationToken cancellationToken = default)
    {
        DataConsistencyMissingArchitectureRequestSnapshot snapshot =
            await _diagnostics.GetDataConsistencyMissingArchitectureRequestSnapshotAsync(
                maxSampleRows,
                cancellationToken);

        return Ok(snapshot);
    }

    /// <summary>
    ///     Lists or soft-archives runs missing ArchitectureRequest rows. Use <c>dryRun=true</c> first.
    ///     Capped at <see cref="PaginationDefaults.MaxListingTake" /> rows per call.
    /// </summary>
    [HttpPost("diagnostics/data-consistency/missing-architecture-request-runs")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(MissingArchitectureRequestRemediationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemediateMissingArchitectureRequestRuns(
        [FromQuery] bool dryRun = true,
        [FromQuery] int maxRows = 50,
        CancellationToken cancellationToken = default)
    {
        MissingArchitectureRequestRemediationResult result =
            await _diagnostics.RemediateMissingArchitectureRequestRunsAsync(dryRun, maxRows, cancellationToken);

        return Ok(result);
    }
}
