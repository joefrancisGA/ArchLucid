using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.Routing;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Integrations;

[Collection("ArchLucidEnvMutation")]
[Trait("Category", "Integration")]
public sealed class AzureBoardsIntegrationsControllerTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    [SkippableFact]
    public async Task Get_health_with_reader_jwt_returns_stored_not_configured_status()
    {
        JwtLocalSigningIntegrationTestTenant.Scope testScope =
            await JwtLocalSigningIntegrationTestTenant.SeedStandardTierScopeAsync(factory);

        string token = JwtLocalSigningIntegrationTestTenant.MintBearerJwtForScope(
            factory,
            testScope,
            "ReaderUser",
            [ArchLucidRoles.Reader]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.GetAsync(
            new Uri($"/{ApiV1Routes.AzureBoardsIntegrations}/health", UriKind.Relative));

        string responseBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, "response body: {0}", responseBody);

        AzureBoardsIntegrationHealthResponse? body =
            await response.Content.ReadFromJsonAsync<AzureBoardsIntegrationHealthResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Status.Should().Be("not_configured");
        body.Reachable.Should().BeFalse();
    }

    [SkippableFact]
    public async Task Get_settings_with_reader_jwt_succeeds()
    {
        JwtLocalSigningIntegrationTestTenant.Scope testScope =
            await JwtLocalSigningIntegrationTestTenant.SeedStandardTierScopeAsync(factory);

        string token = JwtLocalSigningIntegrationTestTenant.MintBearerJwtForScope(
            factory,
            testScope,
            "ReaderUser",
            [ArchLucidRoles.Reader]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.GetAsync(
            new Uri($"/{ApiV1Routes.AzureBoardsIntegrations}/settings", UriKind.Relative));

        string responseBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, "response body: {0}", responseBody);

        AzureBoardsOutboundSettingsResponse? body =
            await response.Content.ReadFromJsonAsync<AzureBoardsOutboundSettingsResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.IsConfigured.Should().BeFalse();
    }

    [SkippableFact]
    public async Task Put_settings_with_reader_jwt_returns_forbidden()
    {
        JwtLocalSigningIntegrationTestTenant.Scope testScope =
            await JwtLocalSigningIntegrationTestTenant.SeedStandardTierScopeAsync(factory);

        string token = JwtLocalSigningIntegrationTestTenant.MintBearerJwtForScope(
            factory,
            testScope,
            "ReaderUser",
            [ArchLucidRoles.Reader]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        AzureBoardsOutboundSettingsUpsertRequest body = new()
        {
            ProjectName = "ArchLucid",
            DefaultWorkItemType = "Task",
        };

        HttpResponseMessage response = await client.PutAsJsonAsync(
            new Uri($"/{ApiV1Routes.AzureBoardsIntegrations}/settings", UriKind.Relative),
            body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Put_settings_with_admin_jwt_succeeds()
    {
        JwtLocalSigningIntegrationTestTenant.Scope testScope =
            await JwtLocalSigningIntegrationTestTenant.SeedStandardTierScopeAsync(factory);

        string token = JwtLocalSigningIntegrationTestTenant.MintBearerJwtForScope(
            factory,
            testScope,
            "AdminUser",
            [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        AzureBoardsOutboundSettingsUpsertRequest body = new()
        {
            ProjectName = "ArchLucid",
            DefaultWorkItemType = "Task",
            DefaultTags = "archlucid",
        };

        HttpResponseMessage put = await client.PutAsJsonAsync(
            new Uri($"/{ApiV1Routes.AzureBoardsIntegrations}/settings", UriKind.Relative),
            body);

        string putBody = await put.Content.ReadAsStringAsync();
        put.StatusCode.Should().Be(HttpStatusCode.OK, "response body: {0}", putBody);

        AzureBoardsOutboundSettingsResponse? saved =
            await put.Content.ReadFromJsonAsync<AzureBoardsOutboundSettingsResponse>(JsonOptions);

        saved.Should().NotBeNull();
        saved!.IsConfigured.Should().BeTrue();
        saved.ProjectName.Should().Be("ArchLucid");
        saved.DefaultWorkItemType.Should().Be("Task");
    }
}
