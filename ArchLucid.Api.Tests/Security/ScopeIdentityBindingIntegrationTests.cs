using System.Net;

using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-072: ApiKey-authenticated requests with scope headers that disagree with key-bound claims are rejected.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ScopeIdentityBindingIntegrationTests
{
    private const string RunsListPath = "/v1/authority/projects/default/runs?take=1";

    [SkippableFact]
    public async Task ApiKey_with_mismatched_tenant_header_returns_forbidden()
    {
        await using ApiKeyReaderAndAdminArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        client.DefaultRequestHeaders.Add("x-tenant-id", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        HttpResponseMessage response = await client.GetAsync(RunsListPath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task ApiKey_with_matching_tenant_header_is_not_rejected_by_scope_binding()
    {
        await using ApiKeyReaderAndAdminArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        client.DefaultRequestHeaders.Add("x-tenant-id", ScopeIds.DefaultTenant.ToString("D"));
        client.DefaultRequestHeaders.Add("x-workspace-id", ScopeIds.DefaultWorkspace.ToString("D"));
        client.DefaultRequestHeaders.Add("x-project-id", ScopeIds.DefaultProject.ToString("D"));

        HttpResponseMessage response = await client.GetAsync(RunsListPath);

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }
}
