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
public sealed class AzureBoardsIntegrationsControllerTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    [SkippableFact]
    public async Task Get_settings_with_reader_jwt_succeeds()
    {
        string token = factory.MintLocalBearerJwt("ReaderUser", [ArchLucidRoles.Reader]);
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.GetAsync(
            new Uri($"/{ApiV1Routes.AzureBoardsIntegrations}/settings", UriKind.Relative));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        AzureBoardsOutboundSettingsResponse? body =
            await response.Content.ReadFromJsonAsync<AzureBoardsOutboundSettingsResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.IsConfigured.Should().BeFalse();
    }

    [SkippableFact]
    public async Task Put_settings_with_reader_jwt_returns_forbidden()
    {
        string token = factory.MintLocalBearerJwt("ReaderUser", [ArchLucidRoles.Reader]);
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
        string token = factory.MintLocalBearerJwt("AdminUser", [ArchLucidRoles.Admin]);
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

        put.StatusCode.Should().Be(HttpStatusCode.OK);

        AzureBoardsOutboundSettingsResponse? saved =
            await put.Content.ReadFromJsonAsync<AzureBoardsOutboundSettingsResponse>(JsonOptions);

        saved.Should().NotBeNull();
        saved!.IsConfigured.Should().BeTrue();
        saved.ProjectName.Should().Be("ArchLucid");
        saved.DefaultWorkItemType.Should().Be("Task");
    }
}
