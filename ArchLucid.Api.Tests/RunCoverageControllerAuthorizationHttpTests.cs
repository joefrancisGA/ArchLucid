using System.Linq.Expressions;
using System.Net;
using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests;

[Collection("ArchLucidEnvMutation")]
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class RunCoverageControllerAuthorizationHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Theory]
    [InlineData("GET", "")]
    [InlineData("GET", "/acknowledgement")]
    [InlineData("PUT", "/acknowledgement")]
    [InlineData("PATCH", "/{packId}")]
    public async Task Requires_current_share_before_manifest_or_coverage_access(string method, string suffix)
    {
        Guid tenant = ScopeIds.DefaultTenant, workspace = ScopeIds.DefaultWorkspace, project = ScopeIds.DefaultProject;
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid(), packId = Guid.NewGuid();
        const string actor = "Coverage share test";
        bool isRead = method == "GET";
        string? shareRole = isRead ? ArchitectureShareRoles.View : ArchitectureShareRoles.Decide;

        Expression<Func<ScopeContext, bool>> inScope = scope =>
            scope.TenantId == tenant && scope.WorkspaceId == workspace && scope.ProjectId == project;

        Func<ScopeContext, bool> matchesScope = inScope.Compile();

        RunRecord run = new()
        {
            RunId = runId, ArchitectureId = architectureId, TenantId = tenant,
            WorkspaceId = workspace, ScopeProjectId = project,
        };
        ArchitectureIdentityRecord architecture = new()
        {
            ArchitectureId = architectureId, TenantId = tenant, WorkspaceId = workspace,
            ScopeProjectId = project, RestrictToShares = true,
        };
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext scope, Guid _, CancellationToken _) => matchesScope(scope) ? run : null);
        Mock<IArchitectureIdentityRepository> architectures = new(MockBehavior.Strict);
        architectures.Setup(r => r.GetByIdAsync(It.Is<ScopeContext>(inScope), architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(architecture);
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        Mock<IArchitectureShareRepository> shares = new(MockBehavior.Strict);
        shares.Setup(r => r.TryGetAsync(It.Is<ScopeContext>(inScope), architectureId, actor, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => shareRole is { } role
                ? new ArchitectureShareRecord { ArchitectureId = architectureId, ActorOid = actor, Role = role }
                : null);

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(q => q.GetRunDetailAsync(It.Is<ScopeContext>(inScope), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = run,
                GoldenManifest = new ManifestDocument { RunId = runId, ManifestHash = SealedManifestHashTestSupport.DefaultHash },
            });
        Mock<ICoverageQueryService> coverage = new(MockBehavior.Strict);
        Mock<IRunCoverageAcknowledgementService> acknowledgements = new(MockBehavior.Strict);
        switch (method)
        {
            case "GET" when suffix.Length == 0:
                coverage.Setup(q => q.GetByRunIdAsync(It.Is<ScopeContext>(inScope), runId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new CoverageSummary { LegacyCoverageNotRecorded = true });
                break;
            case "GET":
                acknowledgements.Setup(q => q.GetAsync(It.Is<ScopeContext>(inScope), runId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new RunAcknowledgedCoverageDocument());
                break;
            case "PUT":
                acknowledgements.Setup(q => q.PutAcknowledgementAsync(It.Is<ScopeContext>(inScope), runId,
                        It.IsAny<RunAcknowledgedCoverageDocument>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new RunAcknowledgedCoverageDocument());
                break;
            case "PATCH":
                acknowledgements.Setup(q => q.PatchPackExclusionAsync(It.Is<ScopeContext>(inScope), runId, packId,
                        false, null, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new RunCoverageAcknowledgementEntry { PolicyPackId = packId });
                break;
            default:
                throw new InvalidOperationException("Unexpected HTTP method.");
        }

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(runs.Object);
            services.AddSingleton(architectures.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(coverage.Object);
            services.AddSingleton(acknowledgements.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> SendAsync(Guid t, Guid w, Guid p)
        {
            // Admin satisfies the coarse mutation policy. It does not confer a Decide share on a restricted architecture.
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                actor, [isRead ? ArchLucidRoles.Reader : ArchLucidRoles.Admin], t, w, p);
            string path = $"/v1/runs/{runId:D}/coverage{suffix.Replace("{packId}", packId.ToString("D"), StringComparison.Ordinal)}";
            using HttpRequestMessage request = new(new HttpMethod(method), path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", t.ToString("D"));
            request.Headers.Add("x-workspace-id", w.ToString("D"));
            request.Headers.Add("x-project-id", p.ToString("D"));
            if (!isRead)
                request.Content = new StringContent("{}", Encoding.UTF8, "application/json");
            return await client.SendAsync(request);
        }

        using HttpResponseMessage allowed = await SendAsync(tenant, workspace, project);
        allowed.StatusCode.Should().Be(HttpStatusCode.OK);
        if (isRead)
            (allowed.Headers.CacheControl?.NoStore).Should().BeTrue();

        authority.Invocations.Should().ContainSingle();
        (coverage.Invocations.Count + acknowledgements.Invocations.Count).Should().Be(1);
        shares.Invocations.Should().ContainSingle();
        authority.Invocations.Clear();
        coverage.Invocations.Clear();
        acknowledgements.Invocations.Clear();
        shares.Invocations.Clear();
        shareRole = isRead ? null : ArchitectureShareRoles.View;

        using HttpResponseMessage denied = await SendAsync(tenant, workspace, project);
        denied.StatusCode.Should().Be(HttpStatusCode.NotFound);
        shares.Invocations.Should().ContainSingle();

        if (isRead)
        {
            shareRole = ArchitectureShareRoles.View;
            foreach (var (t, w, p) in new[] { (Guid.NewGuid(), workspace, project),
                         (tenant, Guid.NewGuid(), project), (tenant, workspace, Guid.NewGuid()) })
            {
                using HttpResponseMessage mismatch = await SendAsync(t, w, p);
                mismatch.StatusCode.Should().Be(HttpStatusCode.NotFound);
            }
            shares.Invocations.Should().ContainSingle();
        }

        authority.VerifyNoOtherCalls();
        coverage.VerifyNoOtherCalls();
        acknowledgements.VerifyNoOtherCalls();
    }
}
