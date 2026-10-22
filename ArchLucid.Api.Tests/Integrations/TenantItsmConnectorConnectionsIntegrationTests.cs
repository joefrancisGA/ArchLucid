using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Routing;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Integrations;

[Collection("ArchLucidEnvMutation")]
[Trait("Category", "Integration")]
public sealed class TenantItsmConnectorConnectionsIntegrationTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [SkippableFact]
    public async Task Post_jira_connection_with_https_secret_name_returns_bad_request()
    {
        string token = factory.MintLocalBearerJwt("OperatorUser", [ArchLucidRoles.Operator]);
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        TenantItsmConnectorConnectionUpsertRequest body = new()
        {
            InstanceBaseUrl = "https://tenant.atlassian.net",
            AuthUserName = "bot@example.com",
            CredentialKeyVaultSecretName = "https://example.invalid/token"
        };

        HttpResponseMessage res = await client.PostAsJsonAsync(
            new Uri($"/{ApiV1Routes.ItsmConnectorConnections}/jira", UriKind.Relative),
            body);

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Get_post_delete_jira_connection_round_trip()
    {
        string token = factory.MintLocalBearerJwt("OperatorUser", [ArchLucidRoles.Operator]);
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage get0 = await client.GetAsync(
            new Uri($"/{ApiV1Routes.ItsmConnectorConnections}/jira", UriKind.Relative));
        get0.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantItsmConnectorConnectionResponse? empty =
            await get0.Content.ReadFromJsonAsync<TenantItsmConnectorConnectionResponse>(JsonOptions);
        empty.Should().NotBeNull();
        empty!.IsConfigured.Should().BeFalse();

        TenantItsmConnectorConnectionUpsertRequest putBody = new()
        {
            InstanceBaseUrl = "https://tenant.atlassian.net",
            AuthUserName = "bot@example.com",
            CredentialKeyVaultSecretName = "kv-tenant-jira-token",
            InboundWebhookKeyVaultSecretName = "kv-tenant-jira-webhook",
            Label = "pilot tenant"
        };

        HttpResponseMessage post = await client.PostAsJsonAsync(
            new Uri($"/{ApiV1Routes.ItsmConnectorConnections}/jira", UriKind.Relative),
            putBody);
        post.StatusCode.Should().Be(HttpStatusCode.OK);

        TenantItsmConnectorConnectionResponse? saved =
            await post.Content.ReadFromJsonAsync<TenantItsmConnectorConnectionResponse>(JsonOptions);
        saved.Should().NotBeNull();
        saved!.IsConfigured.Should().BeTrue();
        saved.CredentialKeyVaultSecretName.Should().Be("kv-tenant-jira-token");
        saved.InboundWebhookKeyVaultSecretName.Should().Be("kv-tenant-jira-webhook");

        HttpResponseMessage list = await client.GetAsync(
            new Uri($"/{ApiV1Routes.ItsmConnectorConnections}", UriKind.Relative));
        list.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantItsmConnectorConnectionsListResponse? listed =
            await list.Content.ReadFromJsonAsync<TenantItsmConnectorConnectionsListResponse>(JsonOptions);
        listed.Should().NotBeNull();
        listed!.Connections.Should().Contain(c => c.Provider == "Jira" && c.IsConfigured);

        HttpResponseMessage del = await client.DeleteAsync(
            new Uri($"/{ApiV1Routes.ItsmConnectorConnections}/jira", UriKind.Relative));
        del.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
