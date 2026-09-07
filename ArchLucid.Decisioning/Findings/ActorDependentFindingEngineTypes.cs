namespace ArchLucid.Decisioning.Findings;

/// <summary>Built-in engines that require <c>GraphNodeTypes.Actor</c> nodes to produce findings (DX-03 / TB-2344).</summary>
public static class ActorDependentFindingEngineTypes
{
    public const string ExternalExposure = "external-exposure";

    public const string TrustBoundary = "trust-boundary";

    public const string PrivilegedAccess = "privileged-access";

    public static IReadOnlyList<string> All { get; } =
    [
        ExternalExposure,
        TrustBoundary,
        PrivilegedAccess,
    ];
}
