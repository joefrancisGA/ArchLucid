using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace ArchLucid.Api.Tests.InfraEvidence;

[Collection("ArchLucidEnvMutation")]
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class RunScopedEvidenceHubHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Fact]
    public async Task Run_hub_rechecks_share_and_full_scope_before_manifest_or_evidence_reads()
    {
        Guid tenant = ScopeIds.DefaultTenant, workspace = ScopeIds.DefaultWorkspace, project = ScopeIds.DefaultProject;
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid(), resourceId = Guid.NewGuid();
        RunRecord run = new() { RunId = runId, ArchitectureId = architectureId, TenantId = tenant,
            WorkspaceId = workspace, ScopeProjectId = project };
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext s, Guid _, CancellationToken _) =>
                s.TenantId == tenant && s.WorkspaceId == workspace && s.ProjectId == project ? run : null);

        Mock<IArchitectureShareAccessService> shares = new();
        shares.SetupSequence(s => s.EvaluateAsync(It.IsAny<ScopeContext>(), architectureId, It.IsAny<string?>(),
                It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = true })
            .ReturnsAsync(new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = false });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(q => q.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = run, GoldenManifest = new ManifestDocument
                { RunId = runId, ManifestHash = SealedManifestHashTestSupport.DefaultHash } });
        Mock<ICloudResourceEvidenceHubService> hub = new();
        hub.Setup(h => h.TryGetHubAsync(It.IsAny<ScopeContext>(), resourceId,
                It.Is<CloudResourceEvidenceHubQuery>(q => q.RunId == runId), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CloudResourceEvidenceHubQueryResult { Succeeded = true,
                Hub = new CloudResourceEvidenceHubResponse { CloudResourceId = resourceId } });

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(runs.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
            services.AddSingleton(hub.Object);
        }));
        using HttpClient client = host.CreateClient();
        async Task<HttpResponseMessage> ReadAsync(Guid t, Guid w, Guid p)
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "Hub reader", [ArchLucidRoles.Reader], t, w, p);
            using HttpRequestMessage request = new(HttpMethod.Get,
                $"/v1/infra-evidence/cloud-resources/{resourceId:D}/hub?runId={runId:D}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", t.ToString("D"));
            request.Headers.Add("x-workspace-id", w.ToString("D"));
            request.Headers.Add("x-project-id", p.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage allowed = await ReadAsync(tenant, workspace, project);
        allowed.StatusCode.Should().Be(HttpStatusCode.OK);
        (await allowed.Content.ReadFromJsonAsync<CloudResourceEvidenceHubResponse>())!.CloudResourceId.Should().Be(resourceId);
        (allowed.Headers.CacheControl?.NoStore).Should().BeTrue();
        authority.Invocations.Clear();
        hub.Invocations.Clear();

        foreach (var (t, w, p) in new[] { (tenant, workspace, project), (Guid.NewGuid(), workspace, project),
                     (tenant, Guid.NewGuid(), project), (tenant, workspace, Guid.NewGuid()) })
        {
            using HttpResponseMessage denied = await ReadAsync(t, w, p);
            denied.StatusCode.Should().Be(HttpStatusCode.NotFound);
            runs.Verify(r => r.GetByIdAsync(It.Is<ScopeContext>(s =>
                s.TenantId == t && s.WorkspaceId == w && s.ProjectId == p), runId, It.IsAny<CancellationToken>()),
                t == tenant && w == workspace && p == project ? Times.Exactly(2) : Times.Once());
        }

        authority.VerifyNoOtherCalls();
        hub.VerifyNoOtherCalls();
    }
}
