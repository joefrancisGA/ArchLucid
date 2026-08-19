namespace ArchLucid.Cli.Commands;

internal sealed class ItsmPullForwardTriggerCounts
{
    public required int ConnectorPrimaryBlockerPilotCount { get; init; }

    public required int SowContingentOnConnectorCount { get; init; }

    public required int ManualHandoffDominatesSecondReviewCount { get; init; }

    public int ActivatedTriggerCount =>
        (ConnectorPrimaryBlockerPilotCount > 0 ? 1 : 0)
        + (SowContingentOnConnectorCount > 0 ? 1 : 0)
        + (ManualHandoffDominatesSecondReviewCount > 0 ? 1 : 0);
}
