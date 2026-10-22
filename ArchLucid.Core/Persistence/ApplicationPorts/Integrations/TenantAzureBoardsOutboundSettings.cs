namespace ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

/// <summary>Per-tenant Azure Boards outbound work-item defaults (see <c>dbo.TenantAzureBoardsOutboundSettings</c>).</summary>
public sealed class TenantAzureBoardsOutboundSettings
{
    public string ProjectName
    {
        get;
        init;
    } = string.Empty;

    public string DefaultWorkItemType
    {
        get;
        init;
    } = string.Empty;

    public string? AreaPath
    {
        get;
        init;
    }

    public string? IterationPath
    {
        get;
        init;
    }

    public string? DefaultTags
    {
        get;
        init;
    }

    public DateTime? LastConnectionTestUtc
    {
        get;
        init;
    }

    public string? LastConnectionTestSummary
    {
        get;
        init;
    }
}
