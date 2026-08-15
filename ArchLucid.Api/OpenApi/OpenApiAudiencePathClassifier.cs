namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Maps relative OpenAPI paths to <see cref="OpenApiAudience" /> tiers for integrator/procurement snapshots.
/// </summary>
internal static class OpenApiAudiencePathClassifier
{
    internal static string Classify(string? relativePath, bool allowsAnonymous)
    {
        string path = (relativePath ?? string.Empty).Trim('/');

        if (path.StartsWith("v1/internal/", StringComparison.OrdinalIgnoreCase))
            return OpenApiAudience.Internal;

        if (path.Contains("tool-invocation-forensics", StringComparison.OrdinalIgnoreCase)
            || path.Contains("traces/forensics", StringComparison.OrdinalIgnoreCase))
            return OpenApiAudience.Forensics;

        if (path.Contains("buyer-summary", StringComparison.OrdinalIgnoreCase))
            return OpenApiAudience.Buyer;

        if (path.StartsWith("v1/explain/", StringComparison.OrdinalIgnoreCase))
            return OpenApiAudience.Buyer;

        if (path.StartsWith("v1/pilots/", StringComparison.OrdinalIgnoreCase)
            && path.Contains("deltas", StringComparison.OrdinalIgnoreCase))
            return OpenApiAudience.Buyer;

        if (path.StartsWith("v1/roi/", StringComparison.OrdinalIgnoreCase)
            && path.Contains("sponsor", StringComparison.OrdinalIgnoreCase))
            return OpenApiAudience.Buyer;

        if (allowsAnonymous)
            return ClassifyAnonymousRoute(path);

        return OpenApiAudience.Operator;
    }

    private static string ClassifyAnonymousRoute(string path)
    {
        if (path.StartsWith("v1/marketing/", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/demo/", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/registration", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/quickstart", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/auth/trial", StringComparison.OrdinalIgnoreCase)
            || path.Equals("v1/version", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/agent-execution/cost-preview", StringComparison.OrdinalIgnoreCase))
            return OpenApiAudience.Buyer;

        if (path.Contains("webhook", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/integrations/slack", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/admin/client-errors", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/e2e/", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/notifications/exec-digest/unsubscribe", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("v1/notifications/exec-digest/sponsor-view", StringComparison.OrdinalIgnoreCase))
            return OpenApiAudience.Internal;

        return OpenApiAudience.Operator;
    }
}
