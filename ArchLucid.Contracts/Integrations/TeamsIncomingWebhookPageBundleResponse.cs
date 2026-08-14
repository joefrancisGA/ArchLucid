namespace ArchLucid.Contracts.Integrations;

/// <summary>Teams notifications integration page: connection row and trigger catalog.</summary>
public sealed class TeamsIncomingWebhookPageBundleResponse
{
    public required TeamsIncomingWebhookConnectionResponse Connection
    {
        get;
        init;
    }

    public IReadOnlyList<string> TriggerCatalog
    {
        get;
        init;
    } = [];
}
