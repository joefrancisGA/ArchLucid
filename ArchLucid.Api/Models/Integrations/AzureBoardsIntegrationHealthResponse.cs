namespace ArchLucid.Api.Models.Integrations;

public sealed class AzureBoardsIntegrationHealthResponse
{
    public string Status
    {
        get;
        init;
    } = "not_configured";

    public bool Reachable
    {
        get;
        init;
    }

    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public int? StatusCode
    {
        get;
        init;
    }
}

public sealed class AzureBoardsNamedItemsResponse
{
    public IReadOnlyList<string> Items
    {
        get;
        init;
    } = [];
}

public sealed class AzureBoardsConnectionTestResponse
{
    public bool Ok
    {
        get;
        init;
    }

    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public int? StatusCode
    {
        get;
        init;
    }
}
