namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Named assembly lists for INV-006. Intentionally data-heavy: adding a product project requires updating anchors and
///     <see cref="SingleCompositionRootArchitectureTestConstants.CompositionRootScannedProductAssemblyNames" /> together.
/// </summary>
public static class SingleCompositionRootArchitectureTestConstants
{
    /// <summary>
    ///     Product libraries that must not expose public static <see cref="Microsoft.Extensions.DependencyInjection.IServiceCollection" />
    ///     registration entry points outside the composition root (INV-006). Sorted for stable diffs.
    /// </summary>
    public static readonly string[] CompositionRootScannedProductAssemblyNames =
    [
        "ArchLucid.AgentRuntime",
        "ArchLucid.Application",
        "ArchLucid.ArtifactSynthesis",
        "ArchLucid.Capabilities.Cost",
        "ArchLucid.ContextIngestion",
        "ArchLucid.Contracts",
        "ArchLucid.Core",
        "ArchLucid.Decisioning",
        "ArchLucid.Integrations.AzureDevOps",
        "ArchLucid.Integrations.AzureExtractor",
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.Notifications",
        "ArchLucid.Persistence",
        "ArchLucid.Provenance",
        "ArchLucid.Retrieval",
    ];

    public static readonly string[] ServiceCollectionExtensionAllowListedAssemblyNames =
    [
        "ArchLucid.Host.Composition",
        "ArchLucid.TestSupport",
    ];
}
