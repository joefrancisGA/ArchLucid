using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.GcpExtractor;

namespace ArchLucid.Core.Costing;

/// <summary>Builds estimator query nodes from manifest topology rows or extractor inventory.</summary>
public static class ManifestInfrastructureCostNodes
{
    /// <summary>Produces nodes from canonical manifest services/datastores plus optional SKU/region hints.</summary>
    public static List<InfrastructureCostQueryNode> FromGoldenTopology(
        IReadOnlyList<ManifestService>? services,

        IReadOnlyList<ManifestDatastore>? datastores)
    {
        List<InfrastructureCostQueryNode> nodes = [];

        if (services is not null)
        {
            nodes.AddRange(from svc in services.OfType<ManifestService>() let name = string.IsNullOrWhiteSpace(svc.ServiceName) ? "(unnamed service)" : svc.ServiceName let quantity = NormalizeQuantity(svc.InstanceCount) select new InfrastructureCostQueryNode("Service", name, svc.RuntimePlatform, NormalizeRegion(svc.AzureArmRegion), NormalizeSkuHint(svc.AzurePricingSku), quantity));
        }

        if (datastores is null) return nodes;
        
        nodes.AddRange(from ds in datastores let name = string.IsNullOrWhiteSpace(ds.DatastoreName) ? "(unnamed datastore)" : ds.DatastoreName select new InfrastructureCostQueryNode("Datastore", name, ds.RuntimePlatform, NormalizeRegion(ds.AzureArmRegion), NormalizeSkuHint(ds.AzurePricingSku), NormalizeQuantity(ds.InstanceCount)));

        return nodes;
    }



    /// <summary>Produces nodes from extractor <c>resources.json</c> entries when resource types match known mappings.</summary>
    public static List<InfrastructureCostQueryNode> FromExtractorInventory(IReadOnlyList<AzureExtractorInventoryResourceLine>? resources)
    {
        List<InfrastructureCostQueryNode> nodes = [];

        if (resources is null || resources.Count == 0)
            return nodes;

        // ReSharper disable once LoopCanBeConvertedToQuery

        foreach (AzureExtractorInventoryResourceLine line in resources)
        {
            RuntimePlatform? platform = AzureArmResourceCostMapper.TryInferPlatform(line.ResourceType);

            if (!platform.HasValue) continue;

            string resourceLabel = string.IsNullOrWhiteSpace(line.Name)
                ?
                "(azure resource)"
                :
                line.Name;

            nodes.Add(new InfrastructureCostQueryNode("AzureResource",
                resourceLabel,
                platform.Value,
                NormalizeRegion(line.Location),
                NormalizeSkuHint(line.SkuName),
                1));
        }

        return nodes;
    }

    /// <summary>Produces nodes from AWS inventory <c>resources.json</c> entries when resource types match known mappings.</summary>
    public static List<InfrastructureCostQueryNode> FromAwsExtractorInventory(
        IReadOnlyList<AzureExtractorInventoryResourceLine>? resources)
    {
        return FromCloudInventoryLines(resources, AwsInventoryResourceCostMapper.TryInferPlatform, "AwsResource", "(aws resource)");
    }

    /// <summary>Produces nodes from GCP inventory <c>resources.json</c> entries when resource types match known mappings.</summary>
    public static List<InfrastructureCostQueryNode> FromGcpExtractorInventory(
        IReadOnlyList<AzureExtractorInventoryResourceLine>? resources)
    {
        return FromCloudInventoryLines(resources, GcpInventoryResourceCostMapper.TryInferPlatform, "GcpResource", "(gcp resource)");
    }

    /// <summary>Produces nodes from Terraform canonical rows that carry billable <see cref="RuntimePlatform"/> mappings.</summary>
    public static List<InfrastructureCostQueryNode> FromTerraformResourceRows(
        IReadOnlyList<TerraformInfrastructureCostResourceRow> resources)
    {
        List<InfrastructureCostQueryNode> nodes = [];

        if (resources is null || resources.Count == 0)
            return nodes;

        foreach (TerraformInfrastructureCostResourceRow row in resources)
        {
            if (!TerraformResourceCostMapper.TryInferPlatformFromTerraformType(row.TerraformType, out RuntimePlatform platform))
                continue;

            string label = string.IsNullOrWhiteSpace(row.DisplayName) ? row.TerraformType : row.DisplayName;

            nodes.Add(new InfrastructureCostQueryNode(
                "TerraformResource",
                label,
                platform,
                NormalizeRegion(row.Region),
                null,
                1));
        }

        return nodes;
    }

    private static List<InfrastructureCostQueryNode> FromCloudInventoryLines(
        IReadOnlyList<AzureExtractorInventoryResourceLine>? resources,
        Func<string?, RuntimePlatform?> inferPlatform,
        string nodeKind,
        string unnamedLabel)
    {
        List<InfrastructureCostQueryNode> nodes = [];

        if (resources is null || resources.Count == 0)
            return nodes;

        foreach (AzureExtractorInventoryResourceLine line in resources)
        {
            RuntimePlatform? platform = inferPlatform(line.ResourceType);

            if (!platform.HasValue)
                continue;

            string resourceLabel = string.IsNullOrWhiteSpace(line.Name) ? unnamedLabel : line.Name;

            nodes.Add(new InfrastructureCostQueryNode(
                nodeKind,
                resourceLabel,
                platform.Value,
                NormalizeRegion(line.Location),
                NormalizeSkuHint(line.SkuName),
                1));
        }

        return nodes;
    }

    internal static string? NormalizeSkuHint(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    internal static string? NormalizeRegion(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static int NormalizeQuantity(int raw)
        => raw < 1 ? 1 : raw;
}
