using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Costing;
using ArchLucid.Contracts.Common;

namespace ArchLucid.ContextIngestion.Canonicalization;

/// <summary>Sets <c>runtimePlatform</c> on Terraform-derived canonical rows for downstream manifest and costing.</summary>
public sealed class TerraformRuntimePlatformCanonicalEnricher : ICanonicalObjectTypeEnricher
{
    public bool CanEnrich(CanonicalObject item)
    {
        ArgumentNullException.ThrowIfNull(item);

        if (item.Properties.ContainsKey("runtimePlatform"))
            return false;

        return item.Properties.ContainsKey("terraformType");
    }

    public CanonicalObject Enrich(CanonicalObject item)
    {
        ArgumentNullException.ThrowIfNull(item);

        if (!item.Properties.TryGetValue("terraformType", out string? terraformType))
            return item;

        if (!TerraformResourceCostMapper.TryInferPlatformFromTerraformType(terraformType, out RuntimePlatform platform))
            return item;

        item.Properties["runtimePlatform"] = platform.ToString();

        return item;
    }
}
