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
            manifest.SchemaVersion.ToString(System.Globalization.CultureInfo.InvariantCulture));
    }

    public static string BuildInFlight(ReviewCacheDependencyManifest manifest, bool publishToProduct)
    {
        return string.Join('|', Build(manifest), publishToProduct ? "publish=1" : "publish=0");
    }
}
