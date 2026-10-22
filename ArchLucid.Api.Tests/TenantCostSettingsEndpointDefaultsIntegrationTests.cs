using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models.Tenancy;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Isolated from <see cref="TenantCostSettingsEndpointTests" /> so PUT round-trip tests cannot run first and leave
///     tenant cost settings configured (xUnit does not guarantee method order within a class).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class TenantCostSettingsEndpointDefaultsIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
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
        body.EaDiscountMultiplier.Should().Be(1.0m);
        body.EaDiscountPercentage.Should().Be(0m);
    }
}
