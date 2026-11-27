using System.Diagnostics;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Http;

namespace ArchLucid.Application.Analysis;

/// <summary>Owns one logical analysis window. Stages and opt-in read retries consume that window.</summary>
internal sealed class AnalysisExecutionBudget : IDisposable
{
    private static ActivitySource StageActivity => ArchLucidInstrumentation.AuthorityRun;
    private readonly OutboundOperationDeadline? _runDeadline;
    private readonly AnalysisStageExecutionOptions _options;
    private readonly CancellationToken _caller;
    private readonly TimeProvider _clock;

    public AnalysisExecutionBudget(
        AnalysisStageExecutionOptions options, TimeProvider clock, TimeSpan runTimeout, CancellationToken caller)
    {
        _options = options;
        _clock = clock;
        _caller = caller;
        _runDeadline = runTimeout > TimeSpan.Zero ? new OutboundOperationDeadline(clock, runTimeout, caller) : null;
    }

    internal SecureNowRecoverySession? RecoverySession { get; set; }

    public CancellationToken Token => _runDeadline?.Token ?? _caller;

    public bool IsExpired => _runDeadline?.IsExpired is true;

    public void EnsureCanContinue(string stage)
    {
        _caller.ThrowIfCancellationRequested();

        if (IsExpired)
            throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.TimedOut);
    }

    public void RecordNotStarted(string stage)
    {
        using Activity? activity = StageActivity.StartActivity(stage, ActivityKind.Internal);
        activity?.SetTag("archlucid.analysis.outcome", AnalysisStageOutcome.NotStarted);
        activity?.SetTag("archlucid.analysis.attempts", 0);
    }

    public async Task ExecuteAsync(string stage, Func<CancellationToken, Task> work, CancellationToken upstream,
        Action<AnalysisStageObservation>? observe = null, Activity? stageActivity = null) =>
        await ExecuteAsync(stage, async token =>
        {
            await work(token).ConfigureAwait(false);

            return true;
        }, upstream, observe: observe, stageActivity: stageActivity).ConfigureAwait(false);

    public Task<T> ExecuteAsync<T>(
        string stage,
        Func<CancellationToken, Task<T>> work,
        CancellationToken upstream,
        Func<Exception, AnalysisReadRetrySignal?>? retrySafeRead = null,
        Action<AnalysisStageObservation>? observe = null,
        Func<T, bool>? succeeded = null,
        Activity? stageActivity = null)
    {
        if (RecoverySession is { } recovery && SecureNowRecoverySession.CanCheckpoint(stage))
        {
            return recovery.ExecuteAsync(stage,
                token => ExecuteStageCoreAsync(stage, work, token, retrySafeRead, observe, succeeded, stageActivity),
                succeeded, upstream);
        }

        return ExecuteStageCoreAsync(stage, work, upstream, retrySafeRead, observe, succeeded, stageActivity);
    }

    private async Task<T> ExecuteStageCoreAsync<T>(
        string stage,
        Func<CancellationToken, Task<T>> work,
        CancellationToken upstream,
        Func<Exception, AnalysisReadRetrySignal?>? retrySafeRead = null,
        Action<AnalysisStageObservation>? observe = null,
        Func<T, bool>? succeeded = null,
        Activity? stageActivity = null)
    {
        long started = _clock.GetTimestamp();
        string outcome = AnalysisStageOutcome.NotStarted;
        int attempts = 0;
        using Activity? ownedActivity = stageActivity is null ? StageActivity.StartActivity(stage, ActivityKind.Internal) : null;
        Activity? activity = stageActivity ?? ownedActivity;
        using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(Token, upstream);
        TimeSpan cap = _options.GetStageTimeout(stage);
        TimeSpan remaining = _runDeadline?.Remaining ?? cap;

        try
        {
            _caller.ThrowIfCancellationRequested();

            if (remaining <= TimeSpan.Zero || upstream.IsCancellationRequested)
                throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.NotStarted);

            using OutboundOperationDeadline deadline = new(_clock, remaining < cap ? remaining : cap, linked.Token);
            int maxAttempts = retrySafeRead is null ? 1 : Math.Clamp(_options.ReadMaxAttempts, 1, 5);
            TimeSpan baseDelay = TimeSpan.FromMilliseconds(Math.Clamp(_options.ReadInitialDelayMilliseconds, 0, 30_000));

            while (true)
            {
                CheckStageDeadline(stage, deadline, upstream);
                attempts++;

                try
                {
                    T result = await work(deadline.Token).ConfigureAwait(false);
                    CheckStageDeadline(stage, deadline, upstream);
                    outcome = succeeded is null || succeeded(result) ? AnalysisStageOutcome.Succeeded : AnalysisStageOutcome.Failed;

                    return result;
                }
                catch (Exception ex) when (ex is not AnalysisStageExecutionException)
                {
                    if (_caller.IsCancellationRequested && ex is not OperationCanceledException)
                        throw;

                    CheckStageDeadline(stage, deadline, upstream);

                    if (ex is OperationCanceledException || retrySafeRead?.Invoke(ex) is not AnalysisReadRetrySignal signal)
                        throw;

                    if (attempts >= maxAttempts)
                        throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.RetryExhausted, ex);

                    TimeSpan delay = DeadlineAwareReadRetryTiming.CalculateRetryDelay(attempts - 1, baseDelay, signal.MinimumDelay);
                    TimeSpan runRemaining = _runDeadline?.Remaining ?? deadline.Remaining;

                    if (delay >= deadline.Remaining || delay >= runRemaining)
                        throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.TimedOut, ex);

                    try
                    {
                        await Task.Delay(delay, _clock, deadline.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        CheckStageDeadline(stage, deadline, upstream);
                        throw;
                    }
                }
            }
        }
        catch (AnalysisStageExecutionException ex)
        {
            outcome = ex.Outcome;
            throw;
        }
        catch (OperationCanceledException) when (_caller.IsCancellationRequested)
        {
            outcome = AnalysisStageOutcome.Canceled;
            throw;
        }
        catch
        {
            outcome = AnalysisStageOutcome.Failed;
            throw;
        }
        finally
        {
            var observation = new AnalysisStageObservation(stage, outcome, attempts, _clock.GetElapsedTime(started));
            activity?.SetTag("archlucid.analysis.outcome", outcome);
            activity?.SetTag("archlucid.analysis.attempts", observation.Attempts);
            activity?.SetTag("archlucid.analysis.elapsed_ms", observation.Elapsed.TotalMilliseconds);
            observe?.Invoke(observation);
        }
    }

    public async Task<(T? Result, AnalysisStageExecutionException? Failure)> ExecuteIndependentAsync<T>(
        string stage, Func<CancellationToken, Task<T>> work, CancellationToken upstream, Func<T, bool> succeeded)
        where T : class
    {
        try
        {
            T result = await ExecuteAsync(stage, work, upstream, succeeded: succeeded).ConfigureAwait(false);

            return (result, succeeded(result) ? null : new AnalysisStageExecutionException(stage, AnalysisStageOutcome.Failed));
        }
        catch (AnalysisStageExecutionException ex)
        {
            return (null, ex);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _caller.ThrowIfCancellationRequested();

            return (null, new AnalysisStageExecutionException(stage, AnalysisStageOutcome.Failed, ex));
        }
    }

    private void CheckStageDeadline(string stage, OutboundOperationDeadline deadline, CancellationToken upstream)
    {
        _caller.ThrowIfCancellationRequested();

        if (IsExpired || deadline.IsExpired || upstream.IsCancellationRequested)
            throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.TimedOut);
    }

    public void Dispose() => _runDeadline?.Dispose();
}
