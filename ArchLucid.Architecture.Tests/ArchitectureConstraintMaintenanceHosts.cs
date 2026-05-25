namespace ArchLucid.Architecture.Tests;

/// <summary>
/// Allowed dependency surface for maintenance / migration executables that intentionally
/// bypass Application and compose over Persistence directly.
/// </summary>
internal static class ArchitectureConstraintMaintenanceHosts
{
    /// <summary>
    /// Direct first-party assemblies referenced by <c>ArchLucid.Backfill.Cli</c> (compile-time metadata).
    /// </summary>
    internal static readonly string[] DirectFirstPartyAssembliesForBackfillCli =
    [
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.Persistence",
    ];

    /// <summary>
    /// Direct or transitive first-party assemblies reachable from <c>ArchLucid.Backfill.Cli</c>.
    /// </summary>
    internal static readonly string[] AllowedFirstPartyAssembliesForBackfillCli =
    [
        "ArchLucid.Contracts",
        "ArchLucid.Core",
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.Persistence",
    ];

    /// <summary>
    /// Direct <c>ProjectReference</c> entries declared in <c>ArchLucid.Backfill.Cli.csproj</c>.
    /// </summary>
    internal static readonly string[] DirectProjectReferencesForBackfillCli =
    [
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.Persistence",
    ];
}
