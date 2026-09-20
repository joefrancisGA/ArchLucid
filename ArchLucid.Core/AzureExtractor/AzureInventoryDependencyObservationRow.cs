namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Redacted Log Analytics dependency observation aggregate (SN-RT-06).
/// </summary>
public sealed class AzureInventoryDependencyObservationRow
{
    public string? SourcePrincipalId
    {
        get;
        init;
    }

    public string? SourceAppRoleName
    {
        get;
        init;
    }

    public string? TargetHost
    {
        get;
        init;
    }

    public string? TargetArmId
    {
        get;
        init;
    }

    public string? TargetCatalog
    {
        get;
        init;
    }

    public string ObservationKind
    {
        get;
        init;
    } = string.Empty;

    public string OperationClass
    {
        get;
        init;
    } = AzureInventoryDependencyObservationOperationClass.Unknown;

    public long EventCount
    {
        get;
        init;
    }

    public string? WindowStartUtc
    {
        get;
        init;
    }

    public string? WindowEndUtc
    {
        get;
        init;
    }

    public string? WorkspaceId
    {
        get;
        init;
    }

    public string CollectionStatus
    {
        get;
        init;
    } = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded;
}
