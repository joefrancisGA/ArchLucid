using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
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
public sealed class RunAgentEvaluationAuthorizationHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Theory]
    [InlineData("/v1/internal/architecture/run/{0}/agent-evaluation")]
    [InlineData("/v1/architecture/review/{0}/agent-evaluation")]
    public async Task Rechecks_current_run_share_before_reading_any_evaluation_inputs(string route)
    {
        Guid tenant = ScopeIds.DefaultTenant, workspace = ScopeIds.DefaultWorkspace, project = ScopeIds.DefaultProject;
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid();
        string run = runId.ToString("D");
        RunRecord record = new() { RunId = runId, ArchitectureId = architectureId, TenantId = tenant,
            WorkspaceId = workspace, ScopeProjectId = project };
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext s, Guid _, CancellationToken _) =>
                s.TenantId == tenant && s.WorkspaceId == workspace && s.ProjectId == project ? record : null);

        bool shareChecked = false;
        bool shareGranted = true;
        Mock<IArchitectureShareAccessService> shares = new();
        shares.Setup(s => s.EvaluateAsync(It.IsAny<ScopeContext>(), architectureId, It.IsAny<string?>(),
                It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .Callback(() => shareChecked = true)
            .ReturnsAsync(() => new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = shareGranted });
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .Callback(() => shareChecked.Should().BeTrue())
            .ReturnsAsync(new RunDetailDto { Run = record, GoldenManifest = new ManifestDocument
                { RunId = runId, ManifestHash = SealedManifestHashTestSupport.DefaultHash } });
        Mock<IAgentExecutionTraceRepository> traces = new(MockBehavior.Strict);
        traces.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), run, It.IsAny<CancellationToken>()))
            .Callback(() => shareChecked.Should().BeTrue())
            .ReturnsAsync(Array.Empty<AgentExecutionTrace>());
        Mock<IAgentEvidencePackageRepository> evidence = new(MockBehavior.Strict);
        evidence.Setup(r => r.GetByRunIdAsync(run, It.IsAny<CancellationToken>()))
            .Callback(() => shareChecked.Should().BeTrue())
            .ReturnsAsync((AgentEvidencePackage?)null);

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(runs.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(traces.Object);
            services.AddSingleton(evidence.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> ReadAsync(Guid t, Guid w, Guid p)
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "Evaluation reader", [ArchLucidRoles.Reader], t, w, p);
            using HttpRequestMessage request = new(HttpMethod.Get,
                string.Format(System.Globalization.CultureInfo.InvariantCulture, route, run));
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", t.ToString("D"));
            request.Headers.Add("x-workspace-id", w.ToString("D"));
            request.Headers.Add("x-project-id", p.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage allowed = await ReadAsync(tenant, workspace, project);
        allowed.StatusCode.Should().Be(HttpStatusCode.OK);
        (allowed.Headers.CacheControl?.NoStore).Should().BeTrue();
        authority.Verify(q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()), Times.Once);
        traces.Verify(q => q.GetByRunIdAsync(It.IsAny<ScopeContext>(), run, It.IsAny<CancellationToken>()), Times.Once);
        evidence.Verify(q => q.GetByRunIdAsync(run, It.IsAny<CancellationToken>()), Times.Once);
        authority.Invocations.Clear();
        traces.Invocations.Clear();
        evidence.Invocations.Clear();
        shareGranted = false;
        shareChecked = false;

        using HttpResponseMessage revoked = await ReadAsync(tenant, workspace, project);
        revoked.StatusCode.Should().Be(HttpStatusCode.NotFound);
        shareChecked.Should().BeTrue();
        foreach (var (t, w, p) in new[] { (Guid.NewGuid(), workspace, project),
                     (tenant, Guid.NewGuid(), project), (tenant, workspace, Guid.NewGuid()) })
        {
            using HttpResponseMessage mismatch = await ReadAsync(t, w, p);
            mismatch.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        authority.VerifyNoOtherCalls();
        traces.VerifyNoOtherCalls();
        evidence.VerifyNoOtherCalls();
    }
}
