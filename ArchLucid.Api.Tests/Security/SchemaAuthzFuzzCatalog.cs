using System.Text.Json;

using ArchLucid.Api.OpenApi;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
/// Classifies OpenAPI operations into the wrong-tenant authz matrix (ABQ-28).
/// Public/marketing routes stay public. Scoped GET/DELETE with path ids are in-matrix.
/// </summary>
public static class SchemaAuthzFuzzCatalog
{
    private static readonly string[] PublicPrefixes =
    [
        "/v1/marketing/",
        "/v1/demo/",
        "/v1/registration",
        "/v1/quickstart",
        "/v1/auth/trial",
        "/v1/version",
        "/v1/agent-execution/cost-preview",
        "/health"
    ];

    public static IReadOnlyList<SchemaAuthzOperation> Classify(JsonElement root)
    {
        if (!root.TryGetProperty("paths", out JsonElement paths) || paths.ValueKind != JsonValueKind.Object)
        {
            return Array.Empty<SchemaAuthzOperation>();
        }

        List<SchemaAuthzOperation> operations = [];

        foreach (JsonProperty pathProperty in paths.EnumerateObject())
        {
            if (pathProperty.Value.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            foreach (JsonProperty methodProperty in pathProperty.Value.EnumerateObject())
            {
                string method = methodProperty.Name.ToUpperInvariant();

                if (method is not "GET" and not "DELETE")
                {
                    continue;
                }

                if (methodProperty.Value.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                operations.Add(ClassifyOperation(method, pathProperty.Name, methodProperty.Value));
            }
        }

        return operations;
    }

    public static IReadOnlyList<string> UncategorizedPublicPaths(IReadOnlyList<SchemaAuthzOperation> operations)
    {
        ArgumentNullException.ThrowIfNull(operations);

        return operations
            .Where(static op => op.IsPublic && op.Path.Contains('{', StringComparison.Ordinal) && !IsCategorizedPublicPath(op.Path))
            .Select(static op => op.Path)
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }

    private static SchemaAuthzOperation ClassifyOperation(string method, string path, JsonElement operation)
    {
        bool isPublic = IsKnownPublicPrefix(path) || HasBuyerAudience(operation);
        bool hasPathId = path.Contains('{', StringComparison.Ordinal);
        bool inMatrix = !isPublic && hasPathId;

        return new SchemaAuthzOperation(method, path, inMatrix, isPublic);
    }

    private static bool HasBuyerAudience(JsonElement operation)
    {
        if (!operation.TryGetProperty("x-archlucid-audience", out JsonElement audience))
        {
            return false;
        }

        if (audience.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        return string.Equals(audience.GetString(), "buyer", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCategorizedPublicPath(string path)
    {
        if (IsKnownPublicPrefix(path))
        {
            return true;
        }

        // Reuse the production audience classifier so new buyer routes stay catalogued
        // without a second path-prefix list that can drift.
        string relative = path.TrimStart('/');
        return string.Equals(
            OpenApiAudiencePathClassifier.Classify(relative, allowsAnonymous: false),
            OpenApiAudience.Buyer,
            StringComparison.Ordinal);
    }

    private static bool IsKnownPublicPrefix(string path)
    {
        string normalized = path.StartsWith('/') ? path : "/" + path;

        foreach (string prefix in PublicPrefixes)
        {
            if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                || string.Equals(normalized, prefix.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
