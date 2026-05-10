namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Named assembly lists for INV-006. Intentionally data-heavy: adding a product project requires updating anchors and
///     <see cref="SingleCompositionRootArchitectureTestConstants.CompositionRootScannedProductAssemblyNames" /> together.
/// </summary>
public static class SingleCompositionRootArchitectureTestConstants
{
    public static readonly string[] CompositionRootScannedProductAssemblyNames =
    [
        "ArchLucid.Application",
        "ArchLucid.Decisioning",
        "ArchLucid.AgentRuntime",
        "ArchLucid.Persistence",
        "ArchLucid.Core",
        "ArchLucid.KnowledgeGraph",
        "ArchLucid.Provenance",
        "ArchLucid.Retrieval",
        "ArchLucid.ContextIngestion",
        "ArchLucid.ArtifactSynthesis",
        "ArchLucid.Notifications",
    ];

    public static readonly string[] ServiceCollectionExtensionAllowListedAssemblyNames =
    [
        "ArchLucid.Host.Composition",
        "ArchLucid.TestSupport",
    ];
}
