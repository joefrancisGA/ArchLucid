namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public interface IExternalTicketConnectorRegistry
{
    IExternalTicketConnector GetRequired(ItsmOutboundIssueProvider provider);

    bool TryGet(ItsmOutboundIssueProvider provider, out IExternalTicketConnector? connector);

    IReadOnlyList<IExternalTicketConnector> Connectors { get; }
}
