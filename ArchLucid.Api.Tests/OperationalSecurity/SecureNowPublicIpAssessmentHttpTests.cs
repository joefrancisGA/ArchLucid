using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.ProductLine;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests.OperationalSecurity;

[Collection("ArchLucidEnvMutation")]
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class SecureNowPublicIpAssessmentHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Fact]
    public async Task Explicit_free_grant_allows_only_the_SecureNow_read_and_does_not_unlock_premium_paths()
    {
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
        };
        ScopeContext otherTenant = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
        };
        ScopeContext otherWorkspace = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = scope.ProjectId,
        };
        ScopeContext otherProject = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = Guid.NewGuid(),
        };
        Guid snapshotId = Guid.NewGuid();
        Guid missingSnapshotId = Guid.NewGuid();
        string url = $"/v1/securenow/free/public-ip-assessment/{snapshotId:D}";
        Mock<IPublicIpAssessmentQueryService> assessments = new(MockBehavior.Strict);
        assessments.Setup(r => r.TryGetAsync(It.Is<ScopeContext>(s =>
                s.TenantId == scope.TenantId && s.WorkspaceId == scope.WorkspaceId && s.ProjectId == scope.ProjectId),
                snapshotId, 1, 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PublicIpAssessmentResponse(snapshotId, null, "Partial", true, "notAssessed", 1, 50, 0, []));
        assessments.Setup(r => r.TryGetAsync(It.Is<ScopeContext>(s =>
                s.TenantId == scope.TenantId && s.WorkspaceId == scope.WorkspaceId && s.ProjectId == scope.ProjectId),
                missingSnapshotId, 1, 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PublicIpAssessmentResponse?)null);
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = scope.TenantId, Tier = TenantTier.Free });
        tenants.Setup(r => r.GetByIdAsync(otherTenant.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = otherTenant.TenantId, Tier = TenantTier.Free });

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(assessments.Object);
            services.AddSingleton(tenants.Object);
            services.PostConfigure<ProductLineDeploymentOptions>(o => o.Deployment = "both");
            services.PostConfigure<SecureNowFreePublicIpAssessmentOptions>(o =>
            {
                o.Enabled = true;
                o.AllowedScopes = [scope];
            });
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> ReadAsync(string path, string product, ScopeContext requestScope)
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "SecureNow free reader", [ArchLucidRoles.Reader], requestScope.TenantId, requestScope.WorkspaceId, requestScope.ProjectId);
            using HttpRequestMessage request = new(HttpMethod.Get, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add(ProductLineHttpHeaderNames.Header, product);
            request.Headers.Add("x-tenant-id", requestScope.TenantId.ToString("D"));
            request.Headers.Add("x-workspace-id", requestScope.WorkspaceId.ToString("D"));
            request.Headers.Add("x-project-id", requestScope.ProjectId.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage granted = await ReadAsync(url, "security", scope);
        Assert.Equal(HttpStatusCode.OK, granted.StatusCode);
        Assert.True(granted.Headers.CacheControl?.NoStore);
        PublicIpAssessmentResponse? result = await granted.Content.ReadFromJsonAsync<PublicIpAssessmentResponse>();
        Assert.NotNull(result);
        Assert.Equal(snapshotId, result.SnapshotId);
        Assert.Equal("notAssessed", result.ObservedReachability);

        using HttpResponseMessage architecture = await ReadAsync(url, "architecture", scope);
        await AssertGenericNotFoundAsync(architecture);
        foreach (ScopeContext deniedScope in new[] { otherTenant, otherWorkspace, otherProject })
        {
            using HttpResponseMessage denied = await ReadAsync(url, "security", deniedScope);
            await AssertGenericNotFoundAsync(denied);
        }

        using HttpResponseMessage ungrantedInvalidPage = await ReadAsync($"{url}?page=0", "security", otherProject);
        await AssertGenericNotFoundAsync(ungrantedInvalidPage);
        using HttpResponseMessage grantedInvalidPage = await ReadAsync($"{url}?page=0", "security", scope);
        Assert.Equal(HttpStatusCode.BadRequest, grantedInvalidPage.StatusCode);
        using HttpResponseMessage missing = await ReadAsync($"/v1/securenow/free/public-ip-assessment/{missingSnapshotId:D}",
            "security", scope);
        await AssertGenericNotFoundAsync(missing);
        using HttpResponseMessage premium = await ReadAsync(
            $"/v1/operational-security/paths/report?snapshotId={snapshotId:D}", "security", scope);
        Assert.Equal(HttpStatusCode.Forbidden, premium.StatusCode);

        assessments.Verify(r => r.TryGetAsync(It.IsAny<ScopeContext>(), snapshotId, 1, 50, It.IsAny<CancellationToken>()), Times.Once);
        assessments.Verify(r => r.TryGetAsync(It.IsAny<ScopeContext>(), missingSnapshotId, 1, 50, It.IsAny<CancellationToken>()), Times.Once);
        assessments.VerifyNoOtherCalls();
    }

    private static async Task AssertGenericNotFoundAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Microsoft.AspNetCore.Mvc.ProblemDetails? problem =
            await response.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal((int)HttpStatusCode.NotFound, problem.Status);
        Assert.Equal(ProblemTypes.ResourceNotFound, problem.Type);
        Assert.Equal("Not Found", problem.Title);
        Assert.Equal("The public IP assessment was not found.", problem.Detail);
    }

    [Fact]
    public void Free_grants_are_disabled_by_default_and_match_all_three_scope_parts()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        SecureNowFreePublicIpAssessmentOptions options = new() { AllowedScopes = [scope] };
        Assert.False(options.Allows(scope));

        options.Enabled = true;
        Assert.True(options.Allows(scope));
        Assert.False(options.Allows(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId }));
        Assert.False(options.Allows(new ScopeContext { TenantId = scope.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = scope.ProjectId }));
        Assert.False(options.Allows(new ScopeContext { TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = Guid.NewGuid() }));
        Assert.False(options.Allows(new ScopeContext()));
    }
}
