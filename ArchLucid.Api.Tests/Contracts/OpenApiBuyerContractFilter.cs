using System.Text.Json.Nodes;

namespace ArchLucid.Api.Tests.Contracts;

/// <summary>
///     Filters canonical OpenAPI JSON to buyer-tier operations for procurement/UI codegen snapshots (TB-286).
/// </summary>
internal static class OpenApiBuyerContractFilter
{
    private const string AudienceExtension = "x-archlucid-audience";

    private const string BuyerAudience = "buyer";

    internal static JsonNode FilterToBuyerContract(JsonNode canonicalOpenApi)
    {
        ArgumentNullException.ThrowIfNull(canonicalOpenApi);

        JsonNode clone = canonicalOpenApi.DeepClone();
        JsonObject root = clone.AsObject();

        if (!root.TryGetPropertyValue("paths", out JsonNode? pathsNode) || pathsNode is not JsonObject paths)
            return clone;

        List<string> removeKeys = [];

        foreach (KeyValuePair<string, JsonNode?> pathEntry in paths)
        {
            if (pathEntry.Value is not JsonObject pathItem)
                continue;

            bool keepPath = false;

            foreach (KeyValuePair<string, JsonNode?> operationEntry in pathItem)
            {
                if (operationEntry.Value is not JsonObject operation)
                    continue;

                if (!IsHttpMethod(operationEntry.Key))
                    continue;

                if (TryGetAudience(operation, out string? audience)
                    && string.Equals(audience, BuyerAudience, StringComparison.Ordinal))
                {
                    keepPath = true;
                    continue;
                }

                if (!TryGetAudience(operation, out _)
                    && string.Equals(ClassifyPath(pathEntry.Key), BuyerAudience, StringComparison.Ordinal))
                    keepPath = true;
            }

            if (!keepPath)
                removeKeys.Add(pathEntry.Key);
        }

        foreach (string key in removeKeys)
            paths.Remove(key);

        return clone;
    }

    internal static bool ContainsInternalPaths(JsonNode buyerContract)
    {
        ArgumentNullException.ThrowIfNull(buyerContract);

        if (!buyerContract.AsObject().TryGetPropertyValue("paths", out JsonNode? pathsNode)
            || pathsNode is not JsonObject paths)
            return false;

        foreach (KeyValuePair<string, JsonNode?> pathEntry in paths)
        {
            if (pathEntry.Key.Contains("/v1/internal/", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool IsHttpMethod(string key) =>
        key is "get" or "put" or "post" or "delete" or "patch" or "head" or "options" or "trace";

    private static bool TryGetAudience(JsonObject operation, out string? audience)
    {
        audience = null;

        if (!operation.TryGetPropertyValue(AudienceExtension, out JsonNode? extensionNode))
            return false;

        audience = extensionNode?.GetValue<string>();
        return !string.IsNullOrWhiteSpace(audience);
    }

    private static string ClassifyPath(string openApiPath)
    {
        string path = openApiPath.Trim('/');
        bool allowsAnonymous = IsAnonymousBuyerPath(openApiPath);

        if (path.StartsWith("v1/internal/", StringComparison.OrdinalIgnoreCase))
            return "internal";

        if (path.Contains("tool-invocation-forensics", StringComparison.OrdinalIgnoreCase)
            || path.Contains("traces/forensics", StringComparison.OrdinalIgnoreCase))
            return "forensics";

        if (path.Contains("buyer-summary", StringComparison.OrdinalIgnoreCase))
            return BuyerAudience;

        if (path.StartsWith("v1/explain/", StringComparison.OrdinalIgnoreCase))
            return BuyerAudience;

        if (path.StartsWith("v1/pilots/", StringComparison.OrdinalIgnoreCase)
            && path.Contains("deltas", StringComparison.OrdinalIgnoreCase))
            return BuyerAudience;

        if (path.StartsWith("v1/roi/", StringComparison.OrdinalIgnoreCase)
            && path.Contains("sponsor", StringComparison.OrdinalIgnoreCase))
            return BuyerAudience;

        if (allowsAnonymous)
            return BuyerAudience;

        return "operator";
    }

    private static bool IsAnonymousBuyerPath(string openApiPath)
    {
        string lower = openApiPath.ToLowerInvariant();

        return lower.StartsWith("/v1/marketing/", StringComparison.Ordinal)
               || lower.StartsWith("/v1/demo/", StringComparison.Ordinal)
               || lower.StartsWith("/v1/registration", StringComparison.Ordinal)
               || lower.StartsWith("/v1/quickstart", StringComparison.Ordinal)
               || lower.StartsWith("/v1/auth/trial", StringComparison.Ordinal)
               || string.Equals(lower, "/v1/version", StringComparison.Ordinal)
               || lower.StartsWith("/v1/agent-execution/cost-preview", StringComparison.Ordinal);
    }
}
