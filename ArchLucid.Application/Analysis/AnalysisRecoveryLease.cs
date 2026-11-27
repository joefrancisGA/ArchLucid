using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

namespace ArchLucid.Application.Analysis;

/// <summary>Heartbeat for one SQL claim. The authoritative fence is checked again in the output transaction.</summary>
internal sealed class AnalysisRecoveryLease : IAsyncDisposable
{
    private const int LeaseSeconds = 30;
    private readonly IAnalysisRecoveryRepository _repository;
    private readonly AnalysisRecoveryStageKey _key;
    private readonly Guid _owner;
    private readonly TimeProvider _clock;
    private readonly CancellationTokenSource _lifetime;
    private readonly CancellationTokenSource _renewal;
    private readonly Task _heartbeat;

    private AnalysisRecoveryLease(
        IAnalysisRecoveryRepository repository, AnalysisRecoveryStageKey key, Guid owner,
        AnalysisRecoveryClaim claim, TimeProvider clock, CancellationToken token)
    {
        _repository = repository;
        _key = key;
        _owner = owner;
        Claim = claim;
        _clock = clock;
        _lifetime = CancellationTokenSource.CreateLinkedTokenSource(token);
        _renewal = CancellationTokenSource.CreateLinkedTokenSource(_lifetime.Token);
        _heartbeat = claim.Owner == owner ? RenewAsync() : Task.CompletedTask;
    }

    public AnalysisRecoveryClaim Claim { get; }
    public bool IsComplete => Claim.State == "succeeded";
    public IDisposable EnterSqlFence(DateTime? observationUtc = null) =>
        AnalysisRecoveryFenceContext.Enter(_key, _owner, Claim.Fence, observationUtc);

    public CancellationToken Token => _lifetime.Token;

    public static async Task<AnalysisRecoveryLease> AcquireAsync(
        IAnalysisRecoveryRepository repository, AnalysisRecoveryStageKey key, string inputVersion,
        int maxAttempts, TimeProvider clock, CancellationToken token, bool replaceAuthorityInputs = false)
    {
        Guid owner = Guid.NewGuid();
        int max = Math.Clamp(maxAttempts, 1, 5);
        AnalysisRecoveryClaim claim = replaceAuthorityInputs
            ? await repository.ClaimForAuthorityInputsAsync(key, inputVersion, owner, LeaseSeconds, max, token)
            : await repository.ClaimAsync(key, inputVersion, owner, LeaseSeconds, max, token);

        if (replaceAuthorityInputs && claim.State == "running" && claim.Owner != owner)
            throw new AnalysisRecoveryLeaseLostException(key.Stage);

        if (!string.Equals(claim.InputVersion, inputVersion, StringComparison.Ordinal))
        {
            if (replaceAuthorityInputs && claim.Attempts >= max)
                throw new AnalysisStageExecutionException(key.Stage, AnalysisStageOutcome.RetryExhausted);

            throw new ConflictException($"Pinned inputs do not match the saved analysis stage '{key.Stage}'.");
        }

        if (claim.State == "failed")
            throw new AnalysisStageExecutionException(key.Stage, AnalysisStageOutcome.RetryExhausted);

        if (claim.State != "succeeded" && claim.Owner != owner)
            throw new AnalysisRecoveryLeaseLostException(key.Stage);

        return new AnalysisRecoveryLease(repository, key, owner, claim, clock, token);
    }

    public async Task CompleteAsync(string resultReference, IArchLucidUnitOfWork? unitOfWork, CancellationToken token)
    {
        await _renewal.CancelAsync();
        await _heartbeat;
        token.ThrowIfCancellationRequested();

        if (!await _repository.CompleteAsync(_key, _owner, Claim.Fence, resultReference, unitOfWork, token))
            throw new AnalysisRecoveryLeaseLostException(_key.Stage);
    }

    public async Task ReleaseAfterFailureAsync(Exception failure, bool interrupted, bool allowReplay = true)
    {
        // Lease expiry is the fallback if the worker is killed or cleanup cannot reach SQL.
        using CancellationTokenSource cleanup = new(TimeSpan.FromSeconds(4), _clock);
        bool retryable = allowReplay && (interrupted || failure is AnalysisRecoveryLeaseLostException ||
            failure is AnalysisDependencyRejectionException { Reason: "upstream_changed_during_execution" or "inputs_changed_during_execution" }
                && _key.Pipeline == "authority" ||
            failure is not AnalysisStageExecutionException { Outcome: not AnalysisStageOutcome.Failed } &&
            SqlTransientDetector.IsTransient(failure));

        if (!retryable && failure is AnalysisDependencyRejectionException { Reason: { } reason }
            && AnalysisCoverageReasons.IsAllowed(reason))
        {
            await _repository.ReleaseWithCoverageReasonAsync(_key, _owner, Claim.Fence, reason, cleanup.Token);

            return;
        }

        await _repository.ReleaseAsync(_key, _owner, Claim.Fence, retryable, cleanup.Token);
    }

    private async Task RenewAsync()
    {
        try
        {
            while (!_renewal.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromSeconds(8), _clock, _renewal.Token);

                if (!await _repository.RenewAsync(_key, _owner, Claim.Fence, LeaseSeconds, _renewal.Token))
                {
                    await _lifetime.CancelAsync();

                    return;
                }
            }
        }
        catch (OperationCanceledException) when (_renewal.IsCancellationRequested)
        {
        }
        catch
        {
            // Stop writing if ownership cannot be revalidated. A future worker will reclaim after expiry.
            await _lifetime.CancelAsync();
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _lifetime.CancelAsync();
        await _heartbeat;
        _renewal.Dispose();
        _lifetime.Dispose();
    }
}
