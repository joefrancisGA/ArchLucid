namespace ArchLucid.Core.AzureExtractor;

/// <summary>Join row linking an app registration to its enterprise service principal (graph-app-role-assignments.json).</summary>
public sealed class AzureInventoryEntraApplicationRegistrationRow
{
    public string AppObjectId
    {
        get;
        init;
    } = string.Empty;

    public string AppId
    {
        get;
        init;
    } = string.Empty;

    public string ServicePrincipalObjectId
    {
        get;
        init;
    } = string.Empty;
}
