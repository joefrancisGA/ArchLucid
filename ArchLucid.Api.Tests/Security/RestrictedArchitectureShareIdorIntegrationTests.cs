using System.Net;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>AS-091: same-tenant workspace reader without share cannot read restricted architecture surfaces.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class RestrictedArchitectureShareIdorIntegrationTests(RestrictedArchitectureShareIdorSeedFixture seed)
    : IClassFixture<RestrictedArchitectureShareIdorSeedFixture>
{
    private const string SqlExplicitUnavailable =
        "Restricted architecture share IDOR tests: SQL integration env not configured.";

    [SkippableFact]
    public async Task Unshared_user_cannot_get_restricted_architecture_sql()
    {
        await AssertUnsharedRouteDeniedAsync(
            "architecture detail",
            client => client.GetAsync($"/v1/architectures/{seed.RestrictedArchitectureId:D}"));
    }

    [SkippableFact]
    public async Task Unshared_user_cannot_list_restricted_architecture_title_sql()
    {
        Skip.If(seed.ShardWarmupTimedOut, GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason);
        Skip.IfNot(seed.SqlReachable, SqlExplicitUnavailable);

        if (seed.Factory is null)
            throw new InvalidOperationException("RestrictedArchitectureShareIdorSeedFixture did not produce a factory.");

        using HttpClient client = CreateUnsharedReaderClient();

        using HttpResponseMessage response = await client.GetAsync("/v1/architectures");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string body = await response.Content.ReadAsStringAsync();
        body.Should().NotContain(RestrictedArchitectureShareIdorSeedFixture.SecretDisplayName);
    }

    [SkippableFact]
    public async Task Unshared_user_cannot_get_restricted_run_review_sql()
    {
        await AssertUnsharedRouteDeniedAsync(
            "architecture review",
            client => client.GetAsync($"/v1/architecture/review/{seed.SeedRunId}"));
    }

    [SkippableFact]
    public async Task Unshared_user_cannot_download_restricted_run_export_sql()
    {
        await AssertUnsharedRouteDeniedAsync(
            "run export zip",
            client => client.GetAsync($"/v1/artifacts/reviews/{seed.SeedRunId}/export"));
    }

    [SkippableFact]
    public async Task Unshared_user_cannot_get_restricted_inventory_binding_sql()
    {
        await AssertUnsharedRouteDeniedAsync(
            "inventory binding",
            client => client.GetAsync($"/v1/architectures/{seed.RestrictedArchitectureId:D}/inventory-binding"));
    }

    private async Task AssertUnsharedRouteDeniedAsync(
        string routeFamily,
        Func<HttpClient, Task<HttpResponseMessage>> send)
    {
        Skip.If(seed.ShardWarmupTimedOut, GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason);
        Skip.IfNot(seed.SqlReachable, SqlExplicitUnavailable);

        if (seed.Factory is null || seed.SeedRunId is null || seed.RestrictedArchitectureId == Guid.Empty)
            throw new InvalidOperationException("RestrictedArchitectureShareIdorSeedFixture did not complete seeding.");

        using HttpClient client = CreateUnsharedReaderClient();

        using HttpResponseMessage response = await send(client);

        response.StatusCode.Should().BeOneOf(
            [HttpStatusCode.NotFound, HttpStatusCode.Forbidden],
            because: $"{routeFamily} must not resolve for same-tenant principals without architecture share.");

        string body = await response.Content.ReadAsStringAsync();
        body.Should().NotContain(RestrictedArchitectureShareIdorSeedFixture.SecretDisplayName);
    }

    private HttpClient CreateUnsharedReaderClient()
    {
        HttpClient client = seed.Factory!.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation(
            ArchLucidAuthOptions.TestActorIdHeader,
            RestrictedArchitectureShareIdorSeedFixture.UnsharedUserId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation(
            ArchLucidAuthOptions.TestActorNameHeader,
            "unshared-as091");
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation(
            ArchLucidAuthOptions.TestActorRoleHeader,
            ArchLucidRoles.Reader);

        return client;
    }
}
