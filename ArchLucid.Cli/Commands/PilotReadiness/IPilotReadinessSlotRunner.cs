namespace ArchLucid.Cli.Commands.PilotReadiness;

internal interface IPilotReadinessSlotRunner
{
    Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default);
}
