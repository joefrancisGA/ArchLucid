namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Manifest / completeness warning codes when Logic App workflow connection collection fails (NR-41).
/// </summary>
public static class AzureInventoryLogicAppConnectionCollectionWarnings
{
    public const string NotCollectedBase = "logic-app-connections-not-collected";

    public const string ReasonInsufficientPermission = "insufficient-permission";

    public const string ReasonHttpError = "http-error";

    public const string ReasonError = "error";

    public static string Format(string reason, string workflowResourceId)
    {
        return $"{NotCollectedBase}:{reason}:{workflowResourceId.Trim().TrimEnd('/')}";
    }

    public static string MapHttpStatusToReason(int statusCode)
    {
        return statusCode is 401 or 403 ? ReasonInsufficientPermission : ReasonHttpError;
    }
}
