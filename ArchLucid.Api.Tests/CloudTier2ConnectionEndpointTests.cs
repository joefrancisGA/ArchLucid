using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for Azure/AWS/GCP Tier 2 cloud connection controllers.</summary>
[Trait("Category", "Slow")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class CloudTier2ConnectionEndpointTests(GreenfieldSqlApiFactory fixture)
    : IClassFixture<GreenfieldSqlApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [SkippableFact]
    public async Task Aws_post_null_body_returns_400()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent content = new("null", Encoding.UTF8, "application/json");
        using HttpResponseMessage response = await client.PostAsync("/v1/aws-extractor/connections", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Aws_post_invalid_account_returns_400()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/aws-extractor/connections",
            new
            {
                accountId = "  ",
                region = "us-east-1",
                roleArn = "arn:aws:iam::123456789012:role/ReadOnly"
            });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Aws_configure_list_disconnect_round_trip()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage post = await client.PostAsJsonAsync(
            "/v1/aws-extractor/connections",
            new
            {
                accountId = "123456789012",
                region = "us-east-1",
                roleArn = "arn:aws:iam::123456789012:role/ArchLucidReadOnly"
            });

        post.StatusCode.Should().Be(HttpStatusCode.OK);

        using JsonDocument postDoc = JsonDocument.Parse(await post.Content.ReadAsStringAsync());
        Guid connectionId = postDoc.RootElement.GetProperty("connectionId").GetGuid();
        postDoc.RootElement.GetProperty("accountId").GetString().Should().Be("123456789012");

        using HttpResponseMessage list = await client.GetAsync("/v1/aws-extractor/connections");
        list.StatusCode.Should().Be(HttpStatusCode.OK);

        JsonElement[] listed =
            (await list.Content.ReadFromJsonAsync<JsonElement[]>(JsonOptions)) ?? [];

        listed.Should().ContainSingle(item => item.GetProperty("connectionId").GetGuid() == connectionId);

        using HttpResponseMessage delete =
            await client.DeleteAsync($"/v1/aws-extractor/connections/{connectionId:D}");

        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task Gcp_post_null_body_returns_400()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent content = new("null", Encoding.UTF8, "application/json");
        using HttpResponseMessage response = await client.PostAsync("/v1/gcp-extractor/connections", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Gcp_post_invalid_project_returns_400()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/gcp-extractor/connections",
            new
            {
                projectId = "",
                workloadIdentityPoolProvider =
                    "projects/1/locations/global/workloadIdentityPools/pool/providers/provider",
                serviceAccountEmail = "svc@test.iam.gserviceaccount.com"
            });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Gcp_configure_list_disconnect_round_trip()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage post = await client.PostAsJsonAsync(
            "/v1/gcp-extractor/connections",
            new
            {
                projectId = "my-gcp-project",
                workloadIdentityPoolProvider =
                    "projects/1/locations/global/workloadIdentityPools/pool/providers/provider",
                serviceAccountEmail = "svc@test.iam.gserviceaccount.com"
            });

        post.StatusCode.Should().Be(HttpStatusCode.OK);

        using JsonDocument postDoc = JsonDocument.Parse(await post.Content.ReadAsStringAsync());
        Guid connectionId = postDoc.RootElement.GetProperty("connectionId").GetGuid();
        postDoc.RootElement.GetProperty("projectId").GetString().Should().Be("my-gcp-project");

        using HttpResponseMessage list = await client.GetAsync("/v1/gcp-extractor/connections");
        list.StatusCode.Should().Be(HttpStatusCode.OK);

        JsonElement[] listed =
            (await list.Content.ReadFromJsonAsync<JsonElement[]>(JsonOptions)) ?? [];

        listed.Should().ContainSingle(item => item.GetProperty("connectionId").GetGuid() == connectionId);

        using HttpResponseMessage delete =
            await client.DeleteAsync($"/v1/gcp-extractor/connections/{connectionId:D}");

        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [SkippableFact]
    public async Task Azure_post_null_body_returns_400()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent content = new("null", Encoding.UTF8, "application/json");
        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/connections", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Azure_configure_and_list_round_trip()
    {
        using HttpClient client = fixture.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage post = await client.PostAsJsonAsync(
            "/v1/azure-extractor/connections",
            new
            {
                tenantId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                clientId = "11111111-2222-3333-4444-555555555555",
                subscriptionIds = "22222222-3333-4444-5555-666666666666"
            });

        post.StatusCode.Should().Be(HttpStatusCode.OK);

        using JsonDocument postDoc = JsonDocument.Parse(await post.Content.ReadAsStringAsync());
        Guid connectionId = postDoc.RootElement.GetProperty("connectionId").GetGuid();

        using HttpResponseMessage list = await client.GetAsync("/v1/azure-extractor/connections");
        list.StatusCode.Should().Be(HttpStatusCode.OK);

        JsonElement[] listed =
            (await list.Content.ReadFromJsonAsync<JsonElement[]>(JsonOptions)) ?? [];

        listed.Should().ContainSingle(item => item.GetProperty("connectionId").GetGuid() == connectionId);
    }

    [SkippableFact]
    public async Task Aws_post_without_execute_authority_returns_403()
    {
        await using ReaderRoleArchLucidApiFactory readerFactory = new();
        using HttpClient client = readerFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/aws-extractor/connections",
            new
            {
                accountId = "123456789012",
                region = "us-east-1",
                roleArn = "arn:aws:iam::123456789012:role/ReadOnly"
            });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
