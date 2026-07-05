using System.Net.Http.Headers;

namespace ArchLucid.Application.Connectors.Publishing;

/// <summary>Resolves outbound Authorization headers for Confluence Cloud publish calls (TB-600).</summary>
public interface IConfluencePublishingHttpAuthenticator
{
    Task<AuthenticationHeaderValue?> TryCreateAuthorizationHeaderAsync(CancellationToken cancellationToken);
}
