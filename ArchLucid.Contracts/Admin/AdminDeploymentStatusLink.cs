namespace ArchLucid.Contracts.Admin;

/// <summary>Safe external/operator link (no credentials).</summary>
public sealed class AdminDeploymentStatusLink
{
    public string Kind
    {
        get;
        set;
    } = "";

    public string Label
    {
        get;
        set;
    } = "";

    public string Url
    {
        get;
        set;
    } = "";
}
