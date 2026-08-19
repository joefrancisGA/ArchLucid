namespace ArchLucid.Architecture.Tests;

/// <summary>Namespace prefixes used with NetArchTest <c>HaveDependencyOn</c> / <c>HaveDependencyOnAny</c> (prefix matching).</summary>
internal static class ArchitectureConstraintNamespaces
{
    /// <summary>
    /// Every first-party <c>ArchLucid.*</c> area except <c>ArchLucid.Core</c>.
    /// <para><b>Do not</b> add <c>ArchLucid.Contracts</c> here: <c>ArchLucid.Core</c> intentionally
    /// references <c>ArchLucid.Contracts</c> for shared DTOs (see <c>ArchLucid.Core.csproj</c>). NetArchTest would flag
    /// <c>RunExplanationSummary</c>, <c>SanitizedLoggerInformationExtensions</c>, and similar types if those prefixes were forbidden.</para>
    /// </summary>
    internal static readonly string[] ForbiddenFromCore =
    [
        "ArchLucid.AgentRuntime",
        "ArchLucid.AgentSimulator",
        "ArchLucid.Api",
        "ArchLucid.Api.Client",
        "ArchLucid.Application",
        "ArchLucid.ArtifactSynthesis",
        "ArchLucid.Backfill",
        "ArchLucid.Capabilities",
        "ArchLucid.Cli",
        "ArchLucid.ContextIngestion",
        "ArchLucid.Decisioning",
        "ArchLucid.Host",
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.Persistence",
        "ArchLucid.Provenance",
        "ArchLucid.Retrieval",
        "ArchLucid.TestSupport",
        "ArchLucid.Worker",
    ];

    /// <summary>
    /// <see cref="ForbiddenFromCore"/> without <c>ArchLucid.Persistence</c>.
    /// <para>Phase 5 (#33) lifted persistence ports into Core under <c>ArchLucid.Persistence.*</c> namespaces;
    /// NetArchTest namespace matching would false-positive on those shims (same pattern as Api vs Retrieval).
    /// The Persistence <b>assembly</b> boundary is enforced by an assembly-metadata rule instead.</para>
    /// </summary>
    internal static readonly string[] ForbiddenFromCoreExcludingPersistencePortShims = ForbiddenFromCore
        .Where(static ns => !string.Equals(ns, "ArchLucid.Persistence", StringComparison.Ordinal))
        .ToArray();

    /// <summary>All <c>ArchLucid.*</c> except <c>ArchLucid.Contracts</c> (Contracts leaf assembly).</summary>
    internal static readonly string[] ForbiddenFromContracts =
    [
        "ArchLucid.AgentRuntime",
        "ArchLucid.AgentSimulator",
        "ArchLucid.Api",
        "ArchLucid.Api.Client",
        "ArchLucid.Application",
        "ArchLucid.ArtifactSynthesis",
        "ArchLucid.Backfill",
        "ArchLucid.Capabilities",
        "ArchLucid.Cli",
        "ArchLucid.ContextIngestion",
        "ArchLucid.Core",
        "ArchLucid.Decisioning",
        "ArchLucid.Host",
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.Persistence",
        "ArchLucid.Provenance",
        "ArchLucid.Retrieval",
        "ArchLucid.TestSupport",
        "ArchLucid.Worker",
    ];
}
