using System.Text.Json;

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>Manual refresh for OP-02 allowlist: ARCHLUCID_REFRESH_CAPABILITY_ALLOWLIST=1 dotnet test --filter Refresh_namespace_allowlist_snapshot</summary>
[Trait("Suite", "Architecture")]
public sealed class ProductCapabilityNamespaceAllowlistRefreshTests
{
    [SkippableFact]
    [Trait("Category", "Unit")]
    public void Refresh_namespace_allowlist_snapshot()
    {
        Skip.IfNot(Environment.GetEnvironmentVariable("ARCHLUCID_REFRESH_CAPABILITY_ALLOWLIST") == "1");

        ProductCapabilityMapDocument map = ProductCapabilityMapLoader.Load();
        IReadOnlyList<ProductCapabilityNamespaceViolation> violations =
            ProductCapabilityNamespaceRatchetEvaluator.DiscoverViolations(map);

        ProductCapabilityNamespaceAllowlistDocument document = new()
        {
            Version = 1,
            Entries = violations
                .Select(
                    static violation => new ProductCapabilityNamespaceAllowlistEntry
                    {
                        TypeName = violation.TypeName,
                        ForbiddenPrefix = violation.ForbiddenPrefix,
                        Reason = "Pre-OP-02 dependency; shrink by removing the reference.",
                    })
                .OrderBy(static entry => entry.TypeName, StringComparer.Ordinal)
                .ThenBy(static entry => entry.ForbiddenPrefix, StringComparer.Ordinal)
                .ToList(),
        };

        JsonSerializerOptions options = new()
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };
        string json = JsonSerializer.Serialize(document, options) + Environment.NewLine;
        File.WriteAllText(ProductCapabilityNamespaceAllowlistLoader.AllowlistFilePath, json);
    }
}
