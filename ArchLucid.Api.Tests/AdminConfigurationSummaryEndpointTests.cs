using System.Net;
using System.Text.Json;

using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/configuration/summary</c> (alias of config-summary; <see cref="ArchLucid.Core.Authorization.ArchLucidPolicies.PlatformInternalOperationsAuthority" />).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminConfigurationSummaryEndpointTests(PlatformOperatorRoleArchLucidApiFactory factory)
    : IClassFixture<PlatformOperatorRoleArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_with_admin_key_returns_rows_with_catalog_fields()
    {
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response =
            await client.GetAsync("/v1/admin/configuration/summary?includeEffectiveValues=false");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        AdminConfigSummaryResponse? parsed = JsonSerializer.Deserialize<AdminConfigSummaryResponse>(body, JsonOptions);

        parsed.Should().NotBeNull();
        parsed.Keys.Should().NotBeNull();
        parsed.Keys!.Count.Should().BeGreaterThan(0);

        ConfigSummaryKeyRow first = parsed.Keys[0];
        first.ConfigPath.Should().NotBeNullOrWhiteSpace();
        first.Description.Should().NotBeNullOrWhiteSpace();
        first.Sources.Should().NotBeNull();
        first.Sources!.Count.Should().BeGreaterThan(0);
        first.EffectiveValue.Should().BeNull();
    }

    [SkippableFact]
    public async Task Get_with_admin_key_masks_sensitive_effective_values()
    {
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response =
            await client.GetAsync("/v1/admin/configuration/summary?includeEffectiveValues=true");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        AdminConfigSummaryResponse? parsed = JsonSerializer.Deserialize<AdminConfigSummaryResponse>(body, JsonOptions);

        parsed.Should().NotBeNull();
        ConfigSummaryKeyRow? conn =
            parsed.Keys?.FirstOrDefault(k => k.ConfigPath?.Contains("ConnectionString", StringComparison.Ordinal) == true);

        if (conn is null || !conn.IsSet)
            return;

        conn.EffectiveValue.Should().Be("***");
    }
}
