using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
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

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Snapshot_hub_checks_current_cited_run_access_before_reading_the_seal(bool explicitSnapshot)
    {
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant, WorkspaceId = ScopeIds.DefaultWorkspace, ProjectId = ScopeIds.DefaultProject,
        };
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid(), snapshotId = Guid.NewGuid();
        var identity = new InMemoryCloudResourceIdentityDirectory();
        var resource = await identity.UpsertOnSnapshotAsync(scope, CloudProvider.Azure,
            "/subscriptions/test/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/fixture",
            snapshotId, "Microsoft.Compute/virtualMachines", null, "rg", null, null);
        RunRecord run = new()
        {
            RunId = runId, ArchitectureId = architectureId, TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId, ScopeProjectId = scope.ProjectId,
        };

        bool runVisibleInScope = true;
        bool shareGranted = true;
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.Is<ScopeContext>(s =>
                s.TenantId == scope.TenantId && s.WorkspaceId == scope.WorkspaceId && s.ProjectId == scope.ProjectId),
                runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => runVisibleInScope ? run : null);
        Mock<IArchitectureShareAccessService> shares = new();
        shares.Setup(s => s.EvaluateAsync(It.IsAny<ScopeContext>(), architectureId, It.IsAny<string?>(),
                It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = shareGranted });

        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new();
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(scope.TenantId, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([Guid.Empty, runId, runId]);
        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(r => r.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .Callback(() => (runVisibleInScope && shareGranted).Should().BeTrue())
            .ReturnsAsync(new RunDetailDto
            {
                Run = run,
                GoldenManifest = new ManifestDocument { RunId = runId, ManifestHash = "fixture-corrupt-hash" },
            });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        Mock<IProjectScopedOperationalSecurityFindingRepository> findings = new();
        findings.Setup(r => r.ListByCloudResourceIdPagedInScopeAsync(
                scope.ToProjectScopeKey(), resource.CloudResourceId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], 0));
        Mock<IProjectScopedRemediationInstanceRepository> remediation = new();
        remediation.Setup(r => r.ListByCloudResourceIdPagedInScopeAsync(
                scope.ToProjectScopeKey(), resource.CloudResourceId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], 0));
        Mock<ICloudResourceAuditLineageResolver> lineage = new();
        lineage.Setup(r => r.ResolveAsync(It.IsAny<ScopeContext>(), resource.CloudResourceId,
                It.IsAny<CloudResourceEvidenceHubQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CloudResourceAuditLineageLink());

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton<ICloudResourceIdentityDirectory>(identity);
            services.AddSingleton(runs.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(reconciliations.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(findings.Object);
            services.AddSingleton(remediation.Object);
            services.AddSingleton(lineage.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> ReadAsync()
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "Hub reader", [ArchLucidRoles.Reader], scope.TenantId, scope.WorkspaceId, scope.ProjectId);
            string query = explicitSnapshot ? $"?snapshotId={snapshotId:D}" : string.Empty;
            using HttpRequestMessage request = new(HttpMethod.Get,
                $"/v1/infra-evidence/cloud-resources/{resource.CloudResourceId:D}/hub{query}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", scope.TenantId.ToString("D"));
            request.Headers.Add("x-workspace-id", scope.WorkspaceId.ToString("D"));
            request.Headers.Add("x-project-id", scope.ProjectId.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage corrupt = await ReadAsync();
        corrupt.StatusCode.Should().Be(HttpStatusCode.Conflict);
        authority.Verify(r => r.GetRunDetailForManifestCompareAsync(
            It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()), Times.Once);

        authority.Invocations.Clear();
        shareGranted = false;
        using HttpResponseMessage revoked = await ReadAsync();
        revoked.StatusCode.Should().Be(HttpStatusCode.OK);
        (revoked.Headers.CacheControl?.NoStore).Should().BeTrue();
        (await revoked.Content.ReadAsStringAsync()).Should().NotContain(runId.ToString("D"));
        authority.VerifyNoOtherCalls();

        shares.Invocations.Clear();
        runVisibleInScope = false;
        shareGranted = true;
        using HttpResponseMessage foreign = await ReadAsync();
        foreign.StatusCode.Should().Be(HttpStatusCode.OK);
        authority.VerifyNoOtherCalls();
        shares.VerifyNoOtherCalls();
    }


    [Theory]
    [InlineData("mermaid/preview")]
    [InlineData("mermaid")]
    [InlineData("mermaid/export.png")]
    public async Task Snapshot_diagram_checks_share_before_reading_the_cited_manifest(string route)
    {
        Guid tenant = ScopeIds.DefaultTenant, workspace = ScopeIds.DefaultWorkspace, project = ScopeIds.DefaultProject;
        Guid runId = Guid.NewGuid(), architecture = Guid.NewGuid(), snapshot = Guid.NewGuid();
        RunRecord run = new() { RunId = runId, ArchitectureId = architecture, TenantId = tenant,
            WorkspaceId = workspace, ScopeProjectId = project };
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.Is<ScopeContext>(s =>
                s.TenantId == tenant && s.WorkspaceId == workspace && s.ProjectId == project),
                runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);
        bool shared = true;
        Mock<IArchitectureShareAccessService> shares = new();
        shares.Setup(s => s.EvaluateAsync(It.IsAny<ScopeContext>(), architecture, It.IsAny<string?>(),
                It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = shared });
        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new();
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(tenant, snapshot, It.IsAny<CancellationToken>()))
            .ReturnsAsync([runId, runId]);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(a => a.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = run, GoldenManifest = new ManifestDocument
                { RunId = runId, ManifestHash = "fixture-corrupt-seal" } });
        Mock<IAzureInventorySnapshotGraphResolver> graph = new(MockBehavior.Strict);
        graph.Setup(g => g.TryResolveGraphAsync(It.Is<ScopeContext>(s =>
                s.TenantId == tenant && s.WorkspaceId == workspace && s.ProjectId == project),
                snapshot, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotGraphResolveResult { ErrorMessage = "Fixture inventory unavailable." });
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(runs.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(reconciliations.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(graph.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> ReadAsync()
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "Snapshot diagram reader", [ArchLucidRoles.Reader], tenant, workspace, project);
            string query = route == "mermaid/preview" ? string.Empty : "?mode=executive";
            using HttpRequestMessage request = new(HttpMethod.Get,
                $"/v1/infra-evidence/snapshots/{snapshot:D}/{route}{query}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", tenant.ToString("D"));
            request.Headers.Add("x-workspace-id", workspace.ToString("D"));
            request.Headers.Add("x-project-id", project.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage readableCorruptSeal = await ReadAsync();
        readableCorruptSeal.StatusCode.Should().Be(HttpStatusCode.Conflict);
        graph.VerifyNoOtherCalls();
        authority.Verify(a => a.GetRunDetailForManifestCompareAsync(
            It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()), Times.Once);

        shared = false;
        authority.Invocations.Clear();
        using HttpResponseMessage revoked = await ReadAsync();
        revoked.StatusCode.Should().Be(HttpStatusCode.NotFound, "the scoped graph fixture, not the unreadable seal, decides the result");
        authority.VerifyNoOtherCalls();
        graph.Verify(g => g.TryResolveGraphAsync(
            It.IsAny<ScopeContext>(), snapshot, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Once);
    }

}
