using System.Runtime.ExceptionServices;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Timeouts that poll <see cref="Task.IsCompleted" /> / <see cref="ManualResetEventSlim.Wait(TimeSpan)" /> on a
///     dedicated thread instead of <see cref="Task.Delay" /> + <see cref="Task.WhenAny" /> (CI #2377: pool exhaustion
///     prevents delay continuations from running, so inner bounds never fire).
/// </summary>
internal static class StarvationProofTimeout
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMilliseconds(100);

    private static readonly TimeSpan DiagnosticLogInterval = TimeSpan.FromSeconds(30);

    /// <summary>
    ///     Returns <see langword="true" /> when <paramref name="task" /> did not complete within <paramref name="budget" />.
    /// </summary>
    internal static bool WaitUntilCompletedOrTimeout(Task task, TimeSpan budget, string? diagnosticContext = null)
    {
        ArgumentNullException.ThrowIfNull(task);

        System.Diagnostics.Stopwatch stopwatch = System.Diagnostics.Stopwatch.StartNew();
        TimeSpan nextDiagnosticLog = DiagnosticLogInterval;

        while (stopwatch.Elapsed < budget)
        {
            if (task.IsCompleted)
                return false;

            if (IntegrationTestDiagnosticEnvironment.IsEnabled
                && stopwatch.Elapsed >= nextDiagnosticLog)
            {
                IntegrationTestDiagnosticEnvironment.LogThreadPoolSnapshot(
                    diagnosticContext ?? nameof(StarvationProofTimeout),
                    stopwatch.Elapsed);

                nextDiagnosticLog += DiagnosticLogInterval;
            }

            Thread.Sleep(PollInterval);
        }

        return !task.IsCompleted;
    }

    /// <summary>
    ///     Runs <paramref name="operation" /> on a dedicated worker thread; throws
    ///     <see cref="TimeoutException" /> when the worker does not finish within <paramref name="budget" />.
    /// </summary>
    internal static T RunSync<T>(Func<T> operation, TimeSpan budget, string operationLabel)
    {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentException.ThrowIfNullOrWhiteSpace(operationLabel);

        ManualResetEventSlim done = new(false);
        T? result = default;
        ExceptionDispatchInfo? fault = null;

        Thread worker = new(_ =>
        {
            try
            {
                result = operation();
            }
            catch (Exception ex)
            {
                fault = ExceptionDispatchInfo.Capture(ex);
            }
            finally
            {
                done.Set();
            }
        })
        {
            IsBackground = true,
            Name = operationLabel + "-worker",
        };

        worker.Start();

        if (!done.Wait(budget))
        {
            throw new TimeoutException(
                operationLabel
                + " exceeded "
                + budget.TotalSeconds.ToString("N0", System.Globalization.CultureInfo.InvariantCulture)
                + "s.");
        }

        if (fault is not null)
            fault.Throw();

        return result!;
    }
}
