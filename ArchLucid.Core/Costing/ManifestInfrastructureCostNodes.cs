using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.AzureExtractor;

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


            foreach (ManifestService? svc in services)


            {


                if (svc is null)


                    continue;

                string name = string.IsNullOrWhiteSpace(svc.ServiceName) ? "(unnamed service)" : svc.ServiceName;

                int quantity = NormalizeQuantity(svc.InstanceCount);

                nodes.Add(new InfrastructureCostQueryNode("Service",



                    name,

                    svc.RuntimePlatform,

                    NormalizeRegion(svc.AzureArmRegion),

                    NormalizeSkuHint(svc.AzurePricingSku),

                    quantity));

            }


        }



        if (datastores is not null)


            foreach (ManifestDatastore? ds in datastores)


            {


                if (ds is null)


                    continue;



                string name = string.IsNullOrWhiteSpace(ds.DatastoreName) ? "(unnamed datastore)" : ds.DatastoreName;

                nodes.Add(new InfrastructureCostQueryNode("Datastore",

                    name,

                    ds.RuntimePlatform,

                    NormalizeRegion(ds.AzureArmRegion),

                    NormalizeSkuHint(ds.AzurePricingSku),

                    NormalizeQuantity(ds.InstanceCount)));

            }



        return nodes;


    }



    /// <summary>Produces nodes from extractor <c>resources.json</c> entries when resource types match known mappings.</summary>
    public static List<InfrastructureCostQueryNode> FromExtractorInventory(IReadOnlyList<AzureExtractorInventoryResourceLine>? resources)


    {


        List<InfrastructureCostQueryNode> nodes = [];


        if (resources is null || resources.Count == 0)

            return nodes;


        foreach (AzureExtractorInventoryResourceLine line in resources)


        {


            RuntimePlatform? platform = AzureArmResourceCostMapper.TryInferPlatform(line.ResourceType);

            if (!platform.HasValue)

                continue;



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



    internal static string? NormalizeSkuHint(string? value)
        =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();


    internal static string? NormalizeRegion(string? value)
        =>


            string.IsNullOrWhiteSpace(value) ? null : value.Trim();



    private static int NormalizeQuantity(int raw)
        =>


            raw < 1 ? 1 : raw;


}
