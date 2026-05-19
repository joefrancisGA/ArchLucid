using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminApiKeySettingsEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_returns_enabled_and_masked_segments()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync("/v1/admin/settings/api-keys");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        AdminApiKeySettingsResponse? body =
            await response.Content.ReadFromJsonAsync<AdminApiKeySettingsResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Enabled.Should().BeTrue();
        body.Admin.IsConfigured.Should().BeTrue();
        body.Admin.MaskedSegments.Should().NotBeEmpty();
        body.Admin.MaskedSegments![0].Should().StartWith("****");
    }

    [SkippableFact]
    public async Task Rotate_replace_returns_plaintext_once_without_logging_in_audit_payload()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/admin/settings/api-keys/rotate",
            new AdminApiKeyRotateRequest { Slot = "Admin", InvalidatePrevious = true });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        AdminApiKeyRotateResponse? body =
            await response.Content.ReadFromJsonAsync<AdminApiKeyRotateResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.PlaintextKey.Should().NotBeNullOrWhiteSpace();
        body.PlaintextKey.Length.Should().BeGreaterThanOrEqualTo(32);
        body.DeploymentAction.Should().Be("Replace");
        body.ReplaceConfigValue.Should().Be(body.PlaintextKey);
    }
}
