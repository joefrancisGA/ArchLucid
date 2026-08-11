using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Hosting;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Idempotent drain signal shared by shutdown hosted services (TB-961).</summary>
internal static class WorkerHostDrainSignal
{
    internal static void BeginIfNeeded(IWorkerHostDrainGate drainGate, ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(drainGate);
        ArgumentNullException.ThrowIfNull(logger);

        if (drainGate.IsDraining)
            return;

        drainGate.BeginDrain();
        ArchLucidInstrumentation.WorkerDrainStartedTotal.Add(1);

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Worker host drain started; new execute ownership leases will not be admitted until shutdown completes.");
        }
    }
}
