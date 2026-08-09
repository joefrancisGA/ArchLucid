using System.Net;
using System.Net.Http.Json;
using System.Text;

using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Authorization and routing smoke tests for <c>ArchLucid.Api</c> controllers TB-635 triaged as genuinely untested.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class GenuinelyUntestedControllersIntegrationTests
{
    [SkippableFact]
    public async Task TenantsAdmin_list_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/v1/admin/tenants");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task TenantsAdmin_list_reader_returns_forbidden()
    {
        await using ReaderRoleArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        HttpResponseMessage response = await client.GetAsync("/v1/admin/tenants");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task AlertRoutingSubscriptions_list_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        HttpResponseMessage response = await client.GetAsync("/v1/alert-routing-subscriptions");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task AlertSimulation_simulate_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent body = new("{}", Encoding.UTF8, "application/json");
        HttpResponseMessage response = await client.PostAsync("/v1/alert-simulation/simulate", body);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task AlertTuning_recommend_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent body = new("{}", Encoding.UTF8, "application/json");
        HttpResponseMessage response = await client.PostAsync("/v1/alert-tuning/recommend-threshold", body);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task CompositeAlertRules_list_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        HttpResponseMessage response = await client.GetAsync("/v1/composite-alert-rules");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task RecommendationLearning_latest_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        HttpResponseMessage response = await client.GetAsync("/v1/recommendation-learning/latest");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task TrialLocalIdentity_register_without_body_returns_bad_request()
    {
        await using ArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsync("/v1/auth/trial/local/register", null);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task AuthorityReplay_reader_returns_forbidden()
    {
        await using ReaderRoleArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent body = new("{}", Encoding.UTF8, "application/json");
        HttpResponseMessage response = await client.PostAsync("/v1/internal/authority/replay", body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task AuthorityRunEvents_list_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        HttpResponseMessage response = await client.GetAsync($"/v1/authority/reviews/{Guid.NewGuid():D}/events");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task RunAgentEvaluation_get_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        HttpResponseMessage response =
            await client.GetAsync("/v1/internal/architecture/review/missing-run/agent-evaluation");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task E2eHarness_disabled_returns_not_found()
    {
        await using ArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/e2e/trial/set-expires",
            new { tenantId = Guid.NewGuid(), expiresUtc = DateTime.UtcNow.AddDays(1) });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
