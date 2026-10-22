using System.Net.Http.Headers;

using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Resolves outbound Authorization headers for ITSM connectors, including OAuth token exchange (TB-600).</summary>
public interface IItsmOutboundHttpAuthenticator
{
    Task<AuthenticationHeaderValue?> TryCreateAuthorizationHeaderAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        ResolvedItsmOutboundCredentials credentials,
        CancellationToken cancellationToken);
}
