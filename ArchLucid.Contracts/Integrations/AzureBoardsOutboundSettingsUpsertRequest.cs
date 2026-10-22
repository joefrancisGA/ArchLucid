namespace ArchLucid.Contracts.Integrations;

public sealed class AzureBoardsOutboundSettingsUpsertRequest
{
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
}
