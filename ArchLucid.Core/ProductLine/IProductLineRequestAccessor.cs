namespace ArchLucid.Core.ProductLine;

/// <summary>Reads deployment config and optional request header to resolve the effective product line (OP-03).</summary>
public interface IProductLineRequestAccessor
{
    ProductLineDeploymentKind GetDeploymentKind();

    EffectiveProductLineKind GetEffectiveProductLine();
}
