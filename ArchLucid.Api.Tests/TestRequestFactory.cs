namespace ArchLucid.Api.Tests;

public static class TestRequestFactory
{
    /// <summary>Unique per <paramref name="requestId" /> so parallel integration shards do not collide on review name.</summary>
    public static string SystemNameForRequest(string requestId) => DeriveUniqueSystemName(requestId);

    public static object CreateArchitectureRequest(string requestId = "REQ-TEST-001")
    {
        return new
        {
            requestId,
            description =
                "Design a secure Azure RAG system for enterprise internal documents using Azure AI Search, managed identity, private endpoints, SQL metadata storage, and moderate cost sensitivity.",
            systemName = DeriveUniqueSystemName(requestId),
            environment = "prod",
            cloudProvider = 1,
            constraints = new[] { "Private endpoints required", "Use managed identity" },
            requiredCapabilities = new[] { "Azure AI Search", "SQL", "Managed Identity", "Private Networking" },
            // Authority commit projects RequiredControls from graph SecurityBaseline nodes (findings), not from agent deltas.
            securityBaselineHints = new[] { "Private Endpoints", "Managed Identity" },
            assumptions = Array.Empty<string>(),
            priorManifestVersion = (string?)null
        };
    }

    private static string DeriveUniqueSystemName(string requestId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(requestId);

        string slug = requestId.Trim().Replace("-", string.Empty, StringComparison.Ordinal);

        if (slug.Length > 48)
            slug = slug[..48];

        return $"EntRag-{slug}";
    }
}
