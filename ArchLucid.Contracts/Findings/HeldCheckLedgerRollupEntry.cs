namespace ArchLucid.Contracts.Findings;

using System.Text.Json.Serialization;

/// <summary>Ranked rollup of engines blocked by one missing input (DX-52).</summary>
public sealed class HeldCheckLedgerRollupEntry
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public HeldCheckInputCode InputCode
    {
        get;
        init;
    }

    public int EngineCount
    {
        get;
        init;
    }

    public IReadOnlyList<string> EngineTypes
    {
        get;
        init;
    } = [];
}
