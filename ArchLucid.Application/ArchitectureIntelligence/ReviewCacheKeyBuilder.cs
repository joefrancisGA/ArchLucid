using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ReviewCacheKeyBuilder
{
    public static string Build(ReviewCacheDependencyManifest manifest)
    {
        return string.Join(
            '|',
            manifest.ContentHash,
            manifest.PromptVersion,
            manifest.ModelVersion,
            manifest.PolicyPackVersion,
            manifest.RubricVersion,
            manifest.TenantConfigurationHash,
            manifest.DeclaredPrioritiesHash,
            manifest.SchemaVersion.ToString(System.Globalization.CultureInfo.InvariantCulture),
            manifest.ReuseReason ?? string.Empty);
    }
}
