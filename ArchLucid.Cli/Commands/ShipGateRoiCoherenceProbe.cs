namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateRoiCoherenceProbeResult
{
    public required string SignalId
    {
        get;
        init;
    }

    public required bool Success
    {
        get;
        init;
    }

    public required string Detail
    {
        get;
        init;
    }
}

internal static partial class ShipGateRoiCoherenceProbe
{
    internal const string SponsorReportPath = "/v1/roi/sponsor-report";
}
