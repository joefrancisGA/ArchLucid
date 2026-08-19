namespace ArchLucid.Core.Tenancy;

public static class WarmTenantCatalogNaming
{
    public static string SqlLogicalNameForStandby(Guid standbyId) => "archlucid_warm_" + standbyId.ToString("N");
}
