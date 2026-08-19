namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed class ExternalTicketConnectorRegistry : IExternalTicketConnectorRegistry
{
    private readonly IReadOnlyDictionary<ItsmOutboundIssueProvider, IExternalTicketConnector> _byProvider;

    public ExternalTicketConnectorRegistry(IEnumerable<IExternalTicketConnector> connectors)
    {
        _byProvider = (connectors ?? throw new ArgumentNullException(nameof(connectors)))
            .ToDictionary(static connector => connector.ProviderId);
        Connectors = _byProvider.Values.ToList();
    }

    public IReadOnlyList<IExternalTicketConnector> Connectors { get; }

    public IExternalTicketConnector GetRequired(ItsmOutboundIssueProvider provider)
    {
        if (!_byProvider.TryGetValue(provider, out IExternalTicketConnector? connector))
            throw new KeyNotFoundException($"No external ticket connector registered for provider '{provider}'.");

        return connector;
    }

    public bool TryGet(ItsmOutboundIssueProvider provider, out IExternalTicketConnector? connector) =>
        _byProvider.TryGetValue(provider, out connector);
}
