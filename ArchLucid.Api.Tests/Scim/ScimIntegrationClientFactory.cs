using System.Net.Http.Headers;

using ArchLucid.Application.Scim.Tokens;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests.Scim;

/// <summary>Mints an active SCIM bearer for <see cref="ScopeIds.DefaultTenant" /> using the in-memory token issuer — no Entra tenant required.</summary>
internal static class ScimIntegrationClientFactory
{
    public static Task<HttpClient> CreateAuthenticatedClientAsync(JwtLocalSigningWebAppFactory factory)
    {
        return CreateAuthenticatedClientAsync(factory, ScopeIds.DefaultTenant);
    }

    public static async Task<HttpClient> CreateAuthenticatedClientAsync(
        JwtLocalSigningWebAppFactory factory,
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        HttpClient http = factory.CreateClient();

        await ScimIntegrationTestTenantSeed.EnsureDefaultTenantAsync(factory.Services, cancellationToken)
            .ConfigureAwait(false);

        using IServiceScope scope = factory.Services.GetRequiredService<IServiceScopeFactory>().CreateScope();
        IScimTokenIssuer issuer = scope.ServiceProvider.GetRequiredService<IScimTokenIssuer>();
        ScimTokenIssueResult minted = await issuer.IssueTokenAsync(tenantId, cancellationToken).ConfigureAwait(false);
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", minted.PlaintextToken);

        return http;
    }
}
