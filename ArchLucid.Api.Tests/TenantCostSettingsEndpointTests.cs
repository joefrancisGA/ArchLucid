using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models.Tenancy;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class TenantCostSettingsEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetCostSettings_returns_defaults_when_unconfigured()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/tenant/cost-settings");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        TenantCostSettingsGetResponse? body =
            await response.Content.ReadFromJsonAsync<TenantCostSettingsGetResponse>(JsonOptions);

        body.Should().NotBeNull();
        body.IsTenantConfigured.Should().BeFalse();
        body.ArchitectHourlyRateUsd.Should().BeGreaterThan(0m);
        body.AverageIncidentCostUsd.Should().BeGreaterThan(0m);
    }

    [SkippableFact]
    public async Task PutCostSettings_persists_and_round_trips()
    {
        TenantCostSettingsPutRequest put = new()
        {
            ArchitectHourlyRateUsd = 175m,
            AverageIncidentCostUsd = 30_000m,
        };

        HttpResponseMessage putResponse = await Client.PutAsJsonAsync("/v1/tenant/cost-settings", put);

        putResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        TenantCostSettingsGetResponse? saved =
            await putResponse.Content.ReadFromJsonAsync<TenantCostSettingsGetResponse>(JsonOptions);

        saved.Should().NotBeNull();
        saved.IsTenantConfigured.Should().BeTrue();
        saved.ArchitectHourlyRateUsd.Should().Be(175m);
        saved.AverageIncidentCostUsd.Should().Be(30_000m);

        HttpResponseMessage getResponse = await Client.GetAsync("/v1/tenant/cost-settings");

        TenantCostSettingsGetResponse? loaded =
            await getResponse.Content.ReadFromJsonAsync<TenantCostSettingsGetResponse>(JsonOptions);

        loaded.Should().NotBeNull();
        loaded.ArchitectHourlyRateUsd.Should().Be(175m);
        loaded.AverageIncidentCostUsd.Should().Be(30_000m);
    }
}
