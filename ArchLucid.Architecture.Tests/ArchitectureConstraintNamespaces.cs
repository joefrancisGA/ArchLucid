namespace ArchLucid.Architecture.Tests;

/// <summary>Namespace prefixes used with NetArchTest <c>HaveDependencyOn</c> / <c>HaveDependencyOnAny</c> (prefix matching).</summary>
internal static class ArchitectureConstraintNamespaces
{
    /// <summary>Every first-party <c>ArchLucid.*</c> area except <c>ArchLucid.Core</c>.</summary>
    internal static readonly string[] ForbiddenFromCore =
    [
        "ArchLucid.AgentRuntime",
        "ArchLucid.AgentSimulator",
        "ArchLucid.Api",
        "ArchLucid.Api.Client",
        "ArchLucid.Application",
        "ArchLucid.ArtifactSynthesis",
        "ArchLucid.Backfill",
        "ArchLucid.Cli",
        "ArchLucid.ContextIngestion",
        "ArchLucid.Contracts",
        "ArchLucid.Contracts.Abstractions",
        "ArchLucid.Coordinator",
        "ArchLucid.Decisioning",
        "ArchLucid.Host",
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.Persistence",
        "ArchLucid.Provenance",
        "ArchLucid.Retrieval",
        "ArchLucid.TestSupport",
        "ArchLucid.Worker",
    ];

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
        "ArchLucid.Cli",
        "ArchLucid.ContextIngestion",
        "ArchLucid.Contracts.Abstractions",
        "ArchLucid.Coordinator",
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

    /// <summary>Abstractions may reference Contracts; nothing else under ArchLucid.</summary>
    internal static readonly string[] ForbiddenFromContractsAbstractions =
    [
        "ArchLucid.AgentRuntime",
        "ArchLucid.AgentSimulator",
        "ArchLucid.Api",
        "ArchLucid.Api.Client",
        "ArchLucid.Application",
        "ArchLucid.ArtifactSynthesis",
        "ArchLucid.Backfill",
        "ArchLucid.Cli",
        "ArchLucid.ContextIngestion",
        "ArchLucid.Coordinator",
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
