namespace ArchLucid.Core.InfraEvidence;

/// <summary>Bounded traversal defaults for SA-03 privilege-path enumeration.</summary>
public sealed class PrivilegePathEngineOptions
{
    public const int DefaultMaxDepth = 8;

    public const int DefaultMaxPaths = 20;

    public const int DefaultMaxFanOutPerNode = 16;

    public int MaxDepth
    {
        get;
        init;
    } = DefaultMaxDepth;

    public int MaxPaths
    {
        get;
        init;
    } = DefaultMaxPaths;

    public int MaxFanOutPerNode
    {
        get;
        init;
    } = DefaultMaxFanOutPerNode;
}
