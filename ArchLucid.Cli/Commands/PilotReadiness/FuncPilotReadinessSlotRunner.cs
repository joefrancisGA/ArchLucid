namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class FuncPilotReadinessSlotRunner(
    Func<PilotReadinessSlotRunContext, CancellationToken, Task<PilotReadinessBundleSlotResult>> runAsync) : IPilotReadinessSlotRunner
{
    private readonly Func<PilotReadinessSlotRunContext, CancellationToken, Task<PilotReadinessBundleSlotResult>> _runAsync =
        runAsync ?? throw new ArgumentNullException(nameof(runAsync));

    public Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default) =>
        _runAsync(context, cancellationToken);
}
