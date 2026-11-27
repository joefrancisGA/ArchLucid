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
        Guid snapshotId = Guid.NewGuid();
        string url = $"/v1/securenow/free/public-ip-assessment/{snapshotId:D}";
        Mock<IPublicIpAssessmentQueryService> assessments = new(MockBehavior.Strict);
        assessments.Setup(r => r.TryGetAsync(It.Is<ScopeContext>(s =>
                s.TenantId == scope.TenantId && s.WorkspaceId == scope.WorkspaceId && s.ProjectId == scope.ProjectId),
                snapshotId, 1, 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PublicIpAssessmentResponse(snapshotId, null, "Partial", true, "notAssessed", 1, 50, 0, []));
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = scope.TenantId, Tier = TenantTier.Free });

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

        async Task<HttpResponseMessage> ReadAsync(string path, string product, Guid projectId)
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "SecureNow free reader", [ArchLucidRoles.Reader], scope.TenantId, scope.WorkspaceId, projectId);
            using HttpRequestMessage request = new(HttpMethod.Get, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add(ProductLineHttpHeaderNames.Header, product);
            request.Headers.Add("x-tenant-id", scope.TenantId.ToString("D"));
            request.Headers.Add("x-workspace-id", scope.WorkspaceId.ToString("D"));
            request.Headers.Add("x-project-id", projectId.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage granted = await ReadAsync(url, "security", scope.ProjectId);
        Assert.Equal(HttpStatusCode.OK, granted.StatusCode);
        Assert.True(granted.Headers.CacheControl?.NoStore);
        PublicIpAssessmentResponse? result = await granted.Content.ReadFromJsonAsync<PublicIpAssessmentResponse>();
        Assert.NotNull(result);
        Assert.Equal(snapshotId, result.SnapshotId);
        Assert.Equal("notAssessed", result.ObservedReachability);

        using HttpResponseMessage architecture = await ReadAsync(url, "architecture", scope.ProjectId);
        Assert.Equal(HttpStatusCode.NotFound, architecture.StatusCode);
        using HttpResponseMessage otherProject = await ReadAsync(url, "security", Guid.NewGuid());
        Assert.Equal(HttpStatusCode.NotFound, otherProject.StatusCode);
        using HttpResponseMessage premium = await ReadAsync(
            $"/v1/operational-security/paths/report?snapshotId={snapshotId:D}", "security", scope.ProjectId);
        Assert.Equal(HttpStatusCode.Forbidden, premium.StatusCode);

        assessments.Verify(r => r.TryGetAsync(It.IsAny<ScopeContext>(), snapshotId, 1, 50, It.IsAny<CancellationToken>()), Times.Once);
        assessments.VerifyNoOtherCalls();
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
