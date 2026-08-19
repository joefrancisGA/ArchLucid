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
    public async Task PutCostSettings_accepts_ea_discount_percentage_and_round_trips()
    {
        TenantCostSettingsPutRequest put = new()
        {
            ArchitectHourlyRateUsd = 175m,
            AverageIncidentCostUsd = 30_000m,
            EaDiscountPercentage = 15m,
        };

        HttpResponseMessage putResponse = await Client.PutAsJsonAsync("/v1/tenant/cost-settings", put);

        putResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        TenantCostSettingsGetResponse? saved =
            await putResponse.Content.ReadFromJsonAsync<TenantCostSettingsGetResponse>(JsonOptions);

        saved.Should().NotBeNull();
        saved!.EaDiscountMultiplier.Should().Be(0.85m);
        saved.EaDiscountPercentage.Should().Be(15m);

        HttpResponseMessage getResponse = await Client.GetAsync("/v1/tenant/cost-settings");

        TenantCostSettingsGetResponse? loaded =
            await getResponse.Content.ReadFromJsonAsync<TenantCostSettingsGetResponse>(JsonOptions);

        loaded.Should().NotBeNull();
        loaded!.EaDiscountMultiplier.Should().Be(0.85m);
        loaded.EaDiscountPercentage.Should().Be(15m);
    }

    [SkippableFact]
    public async Task PutCostSettings_rejects_ea_discount_percentage_above_100()
    {
        TenantCostSettingsPutRequest put = new()
        {
            ArchitectHourlyRateUsd = 175m,
            AverageIncidentCostUsd = 30_000m,
            EaDiscountPercentage = 101m,
        };

        HttpResponseMessage putResponse = await Client.PutAsJsonAsync("/v1/tenant/cost-settings", put);

        putResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task PutCostSettings_persists_and_round_trips()
    {
        TenantCostSettingsPutRequest put = new()
        {
            ArchitectHourlyRateUsd = 175m,
            AverageIncidentCostUsd = 30_000m,
            EaDiscountMultiplier = 0.9m,
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
