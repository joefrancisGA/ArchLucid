namespace ArchLucid.Contracts.Integrations;

public sealed class AzureBoardsOutboundSettingsResponse
{
    public Guid TenantId
    {
        get;
        init;
    }

    public bool IsConfigured
    {
        get;
        init;
    }

    public string? ProjectName
    {
        get;
        init;
    }

    public string? DefaultWorkItemType
    {
        get;
        init;
    }

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
