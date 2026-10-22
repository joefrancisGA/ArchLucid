namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateEvidenceGateResult
{
    public required int GateNumber
    {
        get;
        init;
    }

    public required string Name
    {
        get;
        init;
    }

    public required ShipGateEvidenceVerdict Verdict
    {
        get;
        init;
    }

    public required string Evidence
    {
        get;
        init;
    }

    public string? FastestResolution
    {
        get;
        init;
    }
}
