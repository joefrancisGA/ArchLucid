namespace ArchLucid.Core.ProductCapability;

/// <summary>Runtime lookup for OP-01 controller <c>productLine</c> rows (OP-04 route gate).</summary>
public interface IProductCapabilityControllerCatalog
{
    IReadOnlyList<string> AlwaysAllowedRoutePrefixes { get; }

    bool TryGetControllerProductLine(string controllerTypeFullName, out string productLine);
}
