using System.Data;

namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Self-service trial state on <c>dbo.Tenants</c>: activation, metered allowances, lifecycle transitions, and
///     background architecture pre-seed.
/// </summary>
public interface ITenantTrialRepository
{
    /// <summary>Persists self-service trial metadata after optional demo seed (SaaS signup).</summary>
    Task CommitSelfServiceTrialAsync(
        Guid tenantId,
        DateTimeOffset trialStartUtc,
        DateTimeOffset trialExpiresUtc,
        int runsLimit,
        int seatsLimit,
        Guid sampleRunId,
        decimal? baselineReviewCycleHours,
        string? baselineReviewCycleSource,
        DateTimeOffset? baselineReviewCycleCapturedUtc,
        string? companySize,
        int? architectureTeamSize,
        string? industryVertical,
        string? industryVerticalOther,
        CancellationToken ct);

    /// <summary>
    ///     Persists signup baseline review-cycle capture on <c>dbo.Tenants</c> before demo seed / trial activation so
    ///     <c>GET /v1/tenant/trial-status</c> can surface values even when bootstrap fails later (seed failure or email gate).
    /// </summary>
    Task PersistTrialSignupBaselineReviewCycleAsync(
        Guid tenantId,
        decimal baselineReviewCycleHours,
        string? baselineReviewCycleSource,
        DateTimeOffset baselineReviewCycleCapturedUtc,
        CancellationToken ct);

    /// <summary>Marks an active self-service trial as converted after billing activation.</summary>
    /// <param name="tenantId"></param>
    /// <param name="newCommercialTier">When set, updates <c>dbo.Tenants.Tier</c> alongside conversion.</param>
    Task MarkTrialConvertedAsync(Guid tenantId, TenantTier? newCommercialTier, CancellationToken ct);

    /// <summary>
    ///     When the tenant is on an active trial with a run limit, increments <see cref="TenantRecord.TrialRunsUsed" /> once
    ///     under <see cref="TenantRecord.TrialRunsLimit" /> and before <see cref="TenantRecord.TrialExpiresUtc" />.
    ///     No-op when the tenant row is missing or not on a metered active trial. Must run in the same SQL transaction as
    ///     inserting the authority run row when <paramref name="connection" /> is supplied.
    /// </summary>
    /// <exception cref="TrialLimitExceededException">Trial expired or run allowance exhausted.</exception>
    Task TryIncrementActiveTrialRunAsync(
        Guid tenantId,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>
    ///     Reserves one trial seat for <paramref name="principalKey" /> when the tenant is on an active trial with a seat
    ///     limit.
    ///     Idempotent per (<paramref name="tenantId" />, <paramref name="principalKey" />).
    /// </summary>
    /// <exception cref="TrialLimitExceededException">Seat allowance exhausted for a new principal.</exception>
    Task TryClaimTrialSeatAsync(Guid tenantId, string principalKey, CancellationToken ct);

    /// <summary>
    ///     Tenants eligible for automated lifecycle transitions (self-service trial; excludes converted commercial
    ///     tenants).
    /// </summary>
    Task<IReadOnlyList<Guid>> ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken ct);

    /// <summary>
    ///     Atomically inserts <c>dbo.TenantLifecycleTransitions</c> and updates <c>dbo.Tenants.TrialStatus</c> when the
    ///     current
    ///     status matches <paramref name="expectedCurrentStatus" /> (idempotent retry when <c>false</c>).
    /// </summary>
    Task<bool> TryRecordTrialLifecycleTransitionAsync(
        Guid tenantId,
        string expectedCurrentStatus,
        string nextStatus,
        string reason,
        CancellationToken ct);

    /// <summary>
    ///     Sets <c>TrialFirstManifestCommittedUtc</c> once on the tenant's first golden manifest commit (all tiers) and
    ///     returns funnel timing when this invocation performed the transition. Trial-only metrics/audits are layered in
    ///     <see cref="ITrialFunnelCommitHook" /> — this method only mutates the anchor column.
    /// </summary>
    Task<TrialFirstManifestCommitOutcome?> TryMarkFirstManifestCommittedAsync(
        Guid tenantId,
        DateTimeOffset committedUtc,
        CancellationToken ct);

    /// <summary>E2E harness only: sets <see cref="TenantRecord.TrialExpiresUtc" /> (clock tests; never product code).</summary>
    // ReSharper disable once InconsistentNaming
    Task E2eHarnessSetTrialExpiresUtcAsync(Guid tenantId, DateTimeOffset expiresUtc, CancellationToken ct);

    /// <summary>Marks a self-service trial tenant for background simulator pre-seed (idempotent).</summary>
    Task EnqueueTrialArchitecturePreseedAsync(Guid tenantId, CancellationToken ct);

    /// <summary>Tenants with trial pre-seed enqueued but not yet completed.</summary>
    Task<IReadOnlyList<Guid>> ListTenantIdsPendingTrialArchitecturePreseedAsync(int take, CancellationToken ct);

    /// <summary>Persists the committed welcome run id after pre-seed completes.</summary>
    Task MarkTrialArchitecturePreseedCompletedAsync(Guid tenantId, Guid welcomeRunId, CancellationToken ct);

    /// <summary>
    ///     Records a failed pre-seed attempt; returns the new attempt count. Sets <c>TrialArchitecturePreseedFailedUtc</c>
    ///     when the cap (5) is reached.
    /// </summary>
    Task<int> IncrementTrialArchitecturePreseedAttemptAsync(Guid tenantId, string lastError, CancellationToken ct);
}
