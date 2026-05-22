using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Pagination;

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

        await response.EnsureSuccessForTestAsync();
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

        await response.EnsureSuccessForTestAsync();
        AdminApiKeyRotateResponse? body =
            await response.Content.ReadFromJsonAsync<AdminApiKeyRotateResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.PlaintextKey.Should().NotBeNullOrWhiteSpace();
        body.PlaintextKey.Length.Should().BeGreaterThanOrEqualTo(32);
        body.DeploymentAction.Should().Be("Replace");
        body.ReplaceConfigValue.Should().Be(body.PlaintextKey);

        using HttpResponseMessage auditResponse = await client.GetAsync(
            $"/v1/audit/search?eventType={AuditEventTypes.AdminApiKeyRotationMaterialIssued}&take=10");

        await auditResponse.EnsureSuccessForTestAsync();
        CursorPagedResponse<AuditEvent>? auditPage =
            await auditResponse.Content.ReadFromJsonAsync<CursorPagedResponse<AuditEvent>>(JsonOptions);

        auditPage.Should().NotBeNull();
        auditPage!.Items.Should().NotBeEmpty();

        AuditEvent issued = auditPage.Items.First(static e =>
            string.Equals(e.EventType, AuditEventTypes.AdminApiKeyRotationMaterialIssued, StringComparison.Ordinal));

        issued.DataJson.Should().NotBeNullOrWhiteSpace();
        issued.DataJson.Should().NotContain(body.PlaintextKey, "rotation audit must not persist key material");
        issued.DataJson.Should().Contain("deploymentAction");
        issued.DataJson.Should().Contain("configPath");
    }
}
