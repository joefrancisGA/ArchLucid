namespace ArchLucid.Core.InfraEvidence;

/// <summary>Bounded traversal defaults for SA-03 privilege-path enumeration.</summary>
public sealed class PrivilegePathEngineOptions
{
    public const int DefaultMaxDepth = 8;

    public const int DefaultMaxPaths = 20;

    public const int DefaultMaxFanOutPerNode = 16;

    public const int ContinuationMaxDepth = 12;

    public const int ContinuationMaxPaths = 100;

    public const int ContinuationMaxFanOutPerNode = 32;

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

    public static PrivilegePathEngineOptions CreateContinuation() =>
        new()
        {
            MaxDepth = ContinuationMaxDepth,
            MaxPaths = ContinuationMaxPaths,
            MaxFanOutPerNode = ContinuationMaxFanOutPerNode,
        };
}
