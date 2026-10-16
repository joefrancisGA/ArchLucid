using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Integrations;

/// <summary>Teams notifications integration page: connection row and trigger catalog.</summary>
public sealed class TeamsIncomingWebhookPageBundleResponse
{
    public required TeamsIncomingWebhookConnectionResponse Connection
    {
        get;
        init;
    }

    private IReadOnlyList<string> triggerCatalog = [];

    public IReadOnlyList<string> TriggerCatalog
    {
        get => triggerCatalog;
        init => triggerCatalog = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
