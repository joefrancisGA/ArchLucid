using ArchLucid.Core;
using ArchLucid.Core.Authority;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Orchestration;

/// <summary>
///     SQL-backed per-tenant counting gate for authority heavy-stage execution.
/// </summary>
public sealed class SqlTenantAuthorityPipelineConcurrencyGate(
    SqlAuthorityPipelineTenantExecutionLeaseRepository leaseRepository,
    IOptionsMonitor<AuthorityPipelineOptions> authorityPipelineOptions,
    TimeProvider timeProvider) : ITenantAuthorityPipelineConcurrencyGate
{
    private readonly SqlAuthorityPipelineTenantExecutionLeaseRepository _leaseRepository =
        leaseRepository ?? throw new ArgumentNullException(nameof(leaseRepository));

    private readonly IOptionsMonitor<AuthorityPipelineOptions> _authorityPipelineOptions =
        authorityPipelineOptions ?? throw new ArgumentNullException(nameof(authorityPipelineOptions));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task<IAsyncDisposable> AcquireExecutionSlotAsync(
        Guid tenantId,
        Guid runId,
        bool failFastWhenUnavailable,
        CancellationToken cancellationToken = default)
    {
        AuthorityPipelineConcurrencyOptions concurrency = _authorityPipelineOptions.CurrentValue.Concurrency;

        int maxConcurrent = concurrency.MaxConcurrentExecutionsPerTenant;

        if (maxConcurrent <= 0)

            return NoTenantAuthorityPipelineConcurrencyGate.DisabledLease;


        DateTime staleBeforeUtc = _timeProvider.GetUtcNow().UtcDateTime - concurrency.LeaseRecognitionHorizon;

        int pollMs = concurrency.WaitPollMilliseconds;

        if (pollMs < 10)

            pollMs = 10;


        if (pollMs > 5_000)

            pollMs = 5_000;


        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            bool acquired =
                await _leaseRepository.TryAcquireLeaseAsync(tenantId, runId, maxConcurrent, staleBeforeUtc,
                    cancellationToken);

            if (acquired)

                return new ReleaseLeaseDisposable(_leaseRepository, runId);


            if (failFastWhenUnavailable)

                throw new AuthorityTenantConcurrencyLimitExceededException(
                    "The tenant reached the configured maximum concurrent architecture authority executions; retry later.");


            await Task.Delay(pollMs, cancellationToken);
        }
    }

    private sealed class ReleaseLeaseDisposable(
        SqlAuthorityPipelineTenantExecutionLeaseRepository repository,
        Guid runId) : IAsyncDisposable
    {
        private readonly SqlAuthorityPipelineTenantExecutionLeaseRepository _repository =
            repository ?? throw new ArgumentNullException(nameof(repository));

        private readonly Guid _runId = runId;

        public async ValueTask DisposeAsync()
        {
            await _repository.ReleaseLeaseAsync(_runId, CancellationToken.None);
        }
    }

}
