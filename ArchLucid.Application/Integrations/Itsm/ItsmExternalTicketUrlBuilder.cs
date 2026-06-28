using ArchLucid.Application.Integrations.Itsm.Outbound;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Builds operator-facing browse URLs for linked external tickets via connector plugins (TB-397).</summary>
public sealed class ItsmExternalTicketUrlBuilder(IExternalTicketConnectorRegistry connectorRegistry)
{
    private readonly IExternalTicketConnectorRegistry _connectorRegistry =
        connectorRegistry ?? throw new ArgumentNullException(nameof(connectorRegistry));

    public async Task<string?> TryBuildBrowseUrlAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(provider) || string.IsNullOrWhiteSpace(externalKey))
            return null;

        foreach (IExternalTicketConnector connector in _connectorRegistry.Connectors)
        {
            if (!connector.ProviderLabel.Equals(provider, StringComparison.OrdinalIgnoreCase))
                continue;

            return await connector
                .TryBuildBrowseUrlAsync(tenantId, externalKey, externalSysId, cancellationToken)
                .ConfigureAwait(false);
        }

        return null;
    }
}
