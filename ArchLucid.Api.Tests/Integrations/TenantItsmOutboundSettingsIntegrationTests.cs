using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Routing;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Collection("ArchLucidEnvMutation")]
[Trait("Category", "Integration")]
public sealed class TenantItsmOutboundSettingsIntegrationTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    [SkippableFact]
    public async Task Put_settings_with_reader_jwt_returns_forbidden()
    {
        string token = factory.MintLocalBearerJwt("ReaderUser", [ArchLucidRoles.Reader]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        TenantItsmOutboundSettingsUpsertRequest body = new()
        {
            JiraProjectKeyOverride = "ARCH",
        };

        HttpResponseMessage res = await client.PutAsJsonAsync(
            new Uri($"/{ApiV1Routes.ItsmOutboundSettings}", UriKind.Relative),
            body);

        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Put_settings_with_invalid_project_key_returns_bad_request()
    {
        string token = factory.MintLocalBearerJwt("AdminUser", [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        TenantItsmOutboundSettingsUpsertRequest body = new()
        {
            JiraProjectKeyOverride = "bad key!",
        };

        HttpResponseMessage res = await client.PutAsJsonAsync(
            new Uri($"/{ApiV1Routes.ItsmOutboundSettings}", UriKind.Relative),
            body);

        string responseBody = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest, "response body: {0}", responseBody);
    }

    [SkippableFact]
    public async Task Put_settings_with_execute_jwt_succeeds()
    {
        string token = factory.MintLocalBearerJwt("OperatorUser", [ArchLucidRoles.Operator]);
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        TenantItsmOutboundSettingsUpsertRequest body = new()
        {
            JiraProjectKeyOverride = "OPS",
        };

        HttpResponseMessage put = await client.PutAsJsonAsync(
            new Uri($"/{ApiV1Routes.ItsmOutboundSettings}", UriKind.Relative),
            body);

        put.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [SkippableFact]
    public async Task Get_put_round_trip_with_admin_jwt()
    {
        string token = factory.MintLocalBearerJwt("AdminUser", [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage get0 =
            await client.GetAsync(new Uri($"/{ApiV1Routes.ItsmOutboundSettings}", UriKind.Relative));

        get0.StatusCode.Should().Be(HttpStatusCode.OK);

        TenantItsmOutboundSettingsUpsertRequest body = new()
        {
            JiraProjectKeyOverride = "ARCH",
            JiraSendInfoSeverity = true,
            JiraIssueTypeBySeverityJson = "{\"Critical\":\"Bug\"}",
            ServiceNowAutoCreateCmdbCi = true,
        };

        HttpResponseMessage put = await client.PutAsJsonAsync(
            new Uri($"/{ApiV1Routes.ItsmOutboundSettings}", UriKind.Relative),
            body);

        put.StatusCode.Should().Be(HttpStatusCode.OK);

        TenantItsmOutboundSettingsResponse? saved =
            await put.Content.ReadFromJsonAsync<TenantItsmOutboundSettingsResponse>(JsonOptions);

        saved.Should().NotBeNull();
        saved!.JiraProjectKeyOverride.Should().Be("ARCH");
        saved.JiraSendInfoSeverity.Should().BeTrue();
        saved.ServiceNowAutoCreateCmdbCi.Should().BeTrue();
        saved.DeploymentCredentials.Should().NotBeNull();

        HttpResponseMessage get1 =
            await client.GetAsync(new Uri($"/{ApiV1Routes.ItsmOutboundSettings}", UriKind.Relative));

        get1.StatusCode.Should().Be(HttpStatusCode.OK);

        TenantItsmOutboundSettingsResponse? loaded =
            await get1.Content.ReadFromJsonAsync<TenantItsmOutboundSettingsResponse>(JsonOptions);

        loaded.Should().NotBeNull();
        loaded!.HasTenantOverrides.Should().BeTrue();
        loaded.JiraProjectKeyOverride.Should().Be("ARCH");
    }
}
