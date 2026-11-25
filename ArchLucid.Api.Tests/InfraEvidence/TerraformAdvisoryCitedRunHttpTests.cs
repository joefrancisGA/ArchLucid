using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Application.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
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
public sealed class TerraformAdvisoryCitedRunHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Fact]
    public async Task Export_checks_snapshot_scope_and_current_run_access_before_manifest_reads()
    {
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
        };
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid(), snapshotId = Guid.NewGuid();
        bool runInScope = true, shareGranted = true, snapshotInScope = true;
        RunRecord run = new()
        {
            RunId = runId, ArchitectureId = architectureId, TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId, ScopeProjectId = scope.ProjectId,
        };
        AzureInventorySnapshotRecord snapshot = new()
        {
            SnapshotId = snapshotId, TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
        };

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => runInScope ? run : null);
        Mock<IArchitectureShareAccessService> shares = new();
        shares.Setup(r => r.EvaluateAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), architectureId, It.IsAny<string?>(),
                It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = shareGranted });

        Mock<IAzureInventorySnapshotRepository> snapshots = new(MockBehavior.Strict);
        snapshots.Setup(r => r.TryGetBySnapshotIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => snapshotInScope ? snapshot : null);
        snapshots.Setup(r => r.TryGetAdvisoryTerraformVisibleSnapshotAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotDetailReadModel { Header = snapshot });
        Mock<IAdvisoryTerraformRepresentationRepository> mappings = new(MockBehavior.Strict);
        mappings.Setup(r => r.ReplaceMappingsAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), snapshotId,
                It.IsAny<IReadOnlyList<AdvisoryTerraformResourceMappingRecord>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new(MockBehavior.Strict);
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(scope.TenantId, snapshotId, It.IsAny<CancellationToken>()))
            .Callback(() => snapshots.Verify(r => r.TryGetBySnapshotIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                snapshotId, It.IsAny<CancellationToken>()), Times.Once))
            .ReturnsAsync([runId, runId]);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(r => r.GetRunDetailForManifestCompareAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                runId, It.IsAny<CancellationToken>()))
            .Callback(() => shares.Verify(r => r.EvaluateAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                architectureId, It.IsAny<string?>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(),
                It.IsAny<CancellationToken>()), Times.Once))
            .ReturnsAsync(new RunDetailDto
            {
                Run = run,
                GoldenManifest = new ManifestDocument { RunId = runId, ManifestHash = "fixture-corrupt-terraform-seal" },
            });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(runs.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(snapshots.Object);
            services.AddSingleton(reconciliations.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(mappings.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> ExportAsync()
        {
            snapshots.Invocations.Clear();
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "Terraform advisory reader", [ArchLucidRoles.Reader], scope.TenantId, scope.WorkspaceId, scope.ProjectId);
            using HttpRequestMessage request = new(HttpMethod.Get, $"/v1/infra-evidence/snapshots/{snapshotId:D}/terraform-advisory");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", scope.TenantId.ToString("D"));
            request.Headers.Add("x-workspace-id", scope.WorkspaceId.ToString("D"));
            request.Headers.Add("x-project-id", scope.ProjectId.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage corrupt = await ExportAsync();
        corrupt.StatusCode.Should().Be(HttpStatusCode.Conflict);
        authority.Invocations.Should().ContainSingle();
        snapshots.VerifyNoOtherCalls();
        mappings.VerifyNoOtherCalls();

        authority.Invocations.Clear();
        shareGranted = false;
        using HttpResponseMessage revoked = await ExportAsync();
        revoked.StatusCode.Should().Be(HttpStatusCode.OK);
        revoked.Content.Headers.ContentType?.MediaType.Should().Be("application/zip");
        authority.VerifyNoOtherCalls();

        shares.Invocations.Clear();
        shareGranted = true;
        runInScope = false;
        using HttpResponseMessage foreignRun = await ExportAsync();
        foreignRun.StatusCode.Should().Be(HttpStatusCode.OK);
        authority.VerifyNoOtherCalls();
        shares.VerifyNoOtherCalls();

        reconciliations.Invocations.Clear();
        mappings.Invocations.Clear();
        snapshots.Invocations.Clear();
        runInScope = true;
        snapshotInScope = false;
        using HttpResponseMessage foreignSnapshot = await ExportAsync();
        foreignSnapshot.StatusCode.Should().Be(HttpStatusCode.NotFound);
        snapshots.Verify(r => r.TryGetBySnapshotIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
            snapshotId, It.IsAny<CancellationToken>()), Times.Once);
        snapshots.VerifyNoOtherCalls();
        reconciliations.VerifyNoOtherCalls();
        authority.VerifyNoOtherCalls();
        mappings.VerifyNoOtherCalls();
    }

    private static bool SameScope(ScopeContext actual, ScopeContext expected) =>
        actual.TenantId == expected.TenantId && actual.WorkspaceId == expected.WorkspaceId && actual.ProjectId == expected.ProjectId;
}
