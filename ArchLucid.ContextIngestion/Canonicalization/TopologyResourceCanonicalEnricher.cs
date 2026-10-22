using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ContextIngestion.Canonicalization;

/// <summary>
///     Adds inferred <c>category</c> for <see cref="CanonicalObject.ObjectType" /> = TopologyResource.
/// </summary>
public sealed class TopologyResourceCanonicalEnricher : ICanonicalObjectTypeEnricher
{
    public bool CanEnrich(CanonicalObject item)
    {
        ArgumentNullException.ThrowIfNull(item);

        return string.Equals(item.ObjectType, "TopologyResource", StringComparison.OrdinalIgnoreCase);
    }

    public CanonicalObject Enrich(CanonicalObject item)
    {
        ArgumentNullException.ThrowIfNull(item);

        if (!item.Properties.ContainsKey("category"))
            item.Properties["category"] = InferCategory(item);

        if (!item.Properties.ContainsKey(CanonicalGraphPropertyKeys.TopologySensitivity))
        {
            item.Properties[CanonicalGraphPropertyKeys.TopologySensitivity] =
                TopologySensitivityClassifier.Classify(item.Name, item.Properties);
        }

        return item;
    }

    private static string InferCategory(CanonicalObject item)
    {
        if (item.Properties.TryGetValue("k8s.kind", out string? k8sKind))
        {
            string kind = k8sKind.ToLowerInvariant();

            if (kind is "deployment" or "statefulset" or "daemonset" or "replicaset" or "pod" or "job" or "cronjob")
                return "compute";

            if (kind is "service" or "ingress")
                return "network";

            if (kind is "persistentvolume" or "persistentvolumeclaim")
                return "storage";
        }

        if (item.Properties.TryGetValue("terraformType", out string? terraformType))
        {
            string t = terraformType.ToLowerInvariant();

            if (t.Contains("virtual_network", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("subnet", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("aws_vpc", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("aws_subnet", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("google_compute_network", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("google_compute_subnetwork", StringComparison.OrdinalIgnoreCase))
                return "network";

            if (t.Contains("storage", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("aws_s3", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("google_storage", StringComparison.OrdinalIgnoreCase))
                return "storage";

            if (t.Contains("web_app", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("linux_web_app", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("container", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("aws_instance", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("aws_lambda", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("aws_eks", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("google_compute_instance", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("google_container_cluster", StringComparison.OrdinalIgnoreCase))
                return "compute";

            if (t.Contains("sql", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("postgres", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("database", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("aws_db", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("aws_rds", StringComparison.OrdinalIgnoreCase) ||
                t.Contains("google_sql", StringComparison.OrdinalIgnoreCase))
                return "data";
        }

        if (!item.Properties.TryGetValue("resourceType", out string? resourceType))
            return "general";

        string r = resourceType.ToLowerInvariant();

        if (r.Contains("network", StringComparison.OrdinalIgnoreCase) ||
            r.Contains("subnet", StringComparison.OrdinalIgnoreCase) ||
            r.Contains("vnet", StringComparison.OrdinalIgnoreCase))
            return "network";

        if (r.Contains("storage", StringComparison.OrdinalIgnoreCase))
            return "storage";

        if (r.Contains("compute", StringComparison.OrdinalIgnoreCase) ||
            r.Contains("appservice", StringComparison.OrdinalIgnoreCase) ||
            r.Contains("container", StringComparison.OrdinalIgnoreCase))
            return "compute";

        if (r.Contains("database", StringComparison.OrdinalIgnoreCase))
            return "data";

        return r.Contains("identity", StringComparison.OrdinalIgnoreCase) ? "identity" : "general";
    }
}
