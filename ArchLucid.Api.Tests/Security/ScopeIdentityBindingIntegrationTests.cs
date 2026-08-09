using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Api.Tests;
using ArchLucid.Core.Authorization;
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
    private const string RunsListPath = "/v1/authority/projects/default/reviews?take=1";

    private const string ScopeDebugPath = "/v1/scope";

    private const string AdminInvitationsPath = "/v1/admin/users/invitations";

    private const string ArtifactRunExportProbePath =
        "/v1/artifacts/reviews/00000000-0000-0000-0000-000000000001/export";

    private static readonly Guid ForgedTenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

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
    public async Task ApiKey_without_tenant_claim_rejects_tenant_header_escalation()
    {
        await using ApiKeyUnboundTenantScopeArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        client.DefaultRequestHeaders.Add("x-tenant-id", ScopeIds.DefaultTenant.ToString("D"));

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

    [SkippableFact]
    public async Task ApiKey_with_mismatched_tenant_header_returns_forbidden_on_artifact_run_export()
    {
        await using ApiKeyReaderAndAdminArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        client.DefaultRequestHeaders.Add("x-tenant-id", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        HttpResponseMessage response = await client.GetAsync(ArtifactRunExportProbePath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Jwt_with_mismatched_tenant_header_returns_forbidden_tb300()
    {
        await using JwtLocalSigningWebAppFactory factory = new();
        string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            "JwtScopeBindingUser",
            [ArchLucidRoles.Admin]);

        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Add("x-tenant-id", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        HttpResponseMessage response = await client.GetAsync(RunsListPath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Jwt_with_matching_scope_headers_is_not_rejected_by_scope_binding_tb300()
    {
        await using JwtLocalSigningWebAppFactory factory = new();
        string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            "JwtScopeBindingUser",
            [ArchLucidRoles.Admin]);

        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Add("x-tenant-id", ScopeIds.DefaultTenant.ToString("D"));
        client.DefaultRequestHeaders.Add("x-workspace-id", ScopeIds.DefaultWorkspace.ToString("D"));
        client.DefaultRequestHeaders.Add("x-project-id", ScopeIds.DefaultProject.ToString("D"));

        HttpResponseMessage response = await client.GetAsync(RunsListPath);

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task DevBypass_with_mismatched_tenant_header_returns_forbidden_tb300()
    {
        await using ScopeIdentityBindingDevBypassArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        client.DefaultRequestHeaders.Remove("x-tenant-id");
        client.DefaultRequestHeaders.Add("x-tenant-id", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        HttpResponseMessage response = await client.GetAsync(RunsListPath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task DevBypass_with_mismatched_workspace_header_returns_forbidden_tb300()
    {
        await using ScopeIdentityBindingDevBypassArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        client.DefaultRequestHeaders.Remove("x-workspace-id");
        client.DefaultRequestHeaders.Add("x-workspace-id", "88888888-8888-8888-8888-888888888888");

        HttpResponseMessage response = await client.GetAsync(RunsListPath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Jwt_with_mismatched_tenant_header_returns_forbidden_on_scope_debug_tb925()
    {
        await using JwtLocalSigningWebAppFactory factory = new();
        using HttpClient client = CreateJwtClientWithForgedTenantHeader(factory);

        HttpResponseMessage response = await client.GetAsync(ScopeDebugPath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Jwt_with_mismatched_tenant_header_returns_forbidden_on_admin_invitations_tb925()
    {
        await using JwtLocalSigningWebAppFactory factory = new();
        using HttpClient client = CreateJwtClientWithForgedTenantHeader(factory);

        HttpResponseMessage response = await client.GetAsync(AdminInvitationsPath);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Jwt_with_matching_scope_headers_returns_claim_tenant_on_scope_debug_tb925()
    {
        await using JwtLocalSigningWebAppFactory factory = new();
        string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            "JwtScopeBindingUser",
            [ArchLucidRoles.Admin]);

        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Add("x-tenant-id", ScopeIds.DefaultTenant.ToString("D"));
        client.DefaultRequestHeaders.Add("x-workspace-id", ScopeIds.DefaultWorkspace.ToString("D"));
        client.DefaultRequestHeaders.Add("x-project-id", ScopeIds.DefaultProject.ToString("D"));

        HttpResponseMessage response = await client.GetAsync(ScopeDebugPath);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string json = await response.Content.ReadAsStringAsync();
        using JsonDocument document = JsonDocument.Parse(json);
        Guid tenantId = document.RootElement.GetProperty("tenantId").GetGuid();

        tenantId.Should().Be(ScopeIds.DefaultTenant);
    }

    private static HttpClient CreateJwtClientWithForgedTenantHeader(JwtLocalSigningWebAppFactory factory)
    {
        string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            "JwtScopeBindingUser",
            [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Add("x-tenant-id", ForgedTenantId.ToString("D"));

        return client;
    }
}
