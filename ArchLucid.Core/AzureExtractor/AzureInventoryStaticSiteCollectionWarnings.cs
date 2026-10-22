namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Manifest / completeness warning codes when Static Web App linked-backend collection fails (NR-42).
/// </summary>
public static class AzureInventoryStaticSiteCollectionWarnings
{
    public const string BackendsNotCollectedBase = "static-site-backends-not-collected";

    public const string ReasonInsufficientPermission = "insufficient-permission";

    public const string ReasonHttpError = "http-error";

    public const string ReasonError = "error";

    public const string ReasonPartialEnumeration = "partial-enumeration";

    public static string Format(string reason, string staticSiteResourceId)
    {
        return $"{BackendsNotCollectedBase}:{reason}:{staticSiteResourceId.Trim().TrimEnd('/')}";
    }

    public static string MapHttpStatusToReason(int statusCode)
    {
        return statusCode is 401 or 403 ? ReasonInsufficientPermission : ReasonHttpError;
    }
}
