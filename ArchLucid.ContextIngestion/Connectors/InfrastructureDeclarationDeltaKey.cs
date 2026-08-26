using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Connectors;

/// <summary>
///     Stable keys for <see cref="InfrastructureDeclarationConnector" /> set-diff deltas.
/// </summary>
/// <remarks>
///     Name alone is insufficient when multiple resources in one declaration share a display name
///     (for example cluster-scoped Kubernetes Deployment and Service both named <c>api</c>).
/// </remarks>
public static class InfrastructureDeclarationDeltaKey
{
    public static string For(CanonicalObject obj)
    {
        ArgumentNullException.ThrowIfNull(obj);

        string baseKey = $"{obj.SourceId}|{obj.ObjectType}|{obj.Name}";

        if (TryGetCanonicalProperty(obj, "k8s.kind", out string? k8sKind))
        {
            string key = $"{baseKey}|k8s.kind:{k8sKind}";

            if (TryGetCanonicalProperty(obj, "k8sOccurrence", out string? occurrence))
                key += $"|occurrence:{occurrence}";

            return key;
        }

        if (TryGetCanonicalProperty(obj, "resourceType", out string? resourceType))
            return InfrastructureDeclarationResourceIdentity.AppendSubtypeRegionDisambiguators(
                $"{baseKey}|resourceType:{resourceType}",
                obj.Properties);

        if (TryGetCanonicalProperty(obj, "terraformType", out string? terraformType))
        {
            string key = $"{baseKey}|terraformType:{terraformType}";

            if (TryGetCanonicalProperty(obj, "terraformOccurrence", out string? occurrence))
                key += $"|occurrence:{occurrence}";

            return key;
        }

        return baseKey;
    }

    private static bool TryGetCanonicalProperty(CanonicalObject obj, string key, out string? canonicalValue)
    {
        canonicalValue = null;

        if (!obj.Properties.TryGetValue(key, out string? value) || string.IsNullOrWhiteSpace(value))
            return false;

        canonicalValue = value.Trim().ToLowerInvariant();

        return true;
    }
}
