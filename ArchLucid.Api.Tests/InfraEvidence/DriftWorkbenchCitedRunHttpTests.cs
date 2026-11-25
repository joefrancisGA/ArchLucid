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
public sealed class DriftWorkbenchCitedRunHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Theory]
    [InlineData("snapshots")]
    [InlineData("diffs")]
    [InlineData("changes-a")]
    [InlineData("changes-b")]
    [InlineData("inventory-rows")]
    public async Task Drift_reads_check_current_cited_run_access_before_manifest_hydration(string route)
    {
        Guid tenant = ScopeIds.DefaultTenant, workspace = ScopeIds.DefaultWorkspace, project = ScopeIds.DefaultProject;
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid(), diffId = Guid.NewGuid();
        Guid snapshotA = Guid.NewGuid(), snapshotB = Guid.NewGuid();
        Guid citedSnapshot = route == "changes-b" ? snapshotB : snapshotA;
        ScopeContext scope = new() { TenantId = tenant, WorkspaceId = workspace, ProjectId = project };

        bool runVisibleInScope = true;
        bool shareGranted = true;
        RunRecord run = new()
        {
            RunId = runId,
            ArchitectureId = architectureId,
            TenantId = tenant,
            WorkspaceId = workspace,
            ScopeProjectId = project,
        };
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => runVisibleInScope ? run : null);
        Mock<IArchitectureShareAccessService> shares = new();
        shares.Setup(s => s.EvaluateAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), architectureId, It.IsAny<string?>(),
                It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = shareGranted });

        AzureInventorySnapshotRecord snapshot = new()
        {
            SnapshotId = snapshotA,
            TenantId = tenant,
            WorkspaceId = workspace,
            ProjectId = project,
        };
        AzureInventoryDiffSummaryRecord diff = new() { DiffId = diffId, SnapshotAId = snapshotA, SnapshotBId = snapshotB };
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots.Setup(r => r.ListSnapshotsAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), It.IsAny<int>(),
                It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { snapshot }, 1));
        snapshots.Setup(r => r.TryGetBySnapshotIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                snapshotA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        snapshots.Setup(r => r.ListResourcesBySnapshotIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                snapshotA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AzureInventoryResourceRecord>());
        Mock<IAzureInventoryDiffRepository> diffs = new();
        diffs.Setup(r => r.TryGetByDiffIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), diffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(diff);
        diffs.Setup(r => r.ListDiffsBySnapshotIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                snapshotA, It.IsAny<CancellationToken>()))
            .ReturnsAsync([diff]);
        diffs.Setup(r => r.ListChangesByDiffIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                diffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AzureInventoryChangeRecord>());

        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new(MockBehavior.Strict);
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(tenant,
                It.Is<Guid>(id => id == snapshotA || id == snapshotB), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, Guid id, CancellationToken _) => id == citedSnapshot ? [runId, runId] : []);
        reconciliations.Setup(r => r.ListRunIdsBySnapshotIdsAsync(tenant,
                It.Is<IReadOnlyList<Guid>>(ids => ids.Count == 1 && ids[0] == snapshotA), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new ArchitectureDiagramReconciliationSnapshotRunRecord { SnapshotId = snapshotA, RunId = runId }]);

        ManifestDocument manifest = new() { RunId = runId, ManifestHash = "fixture-corrupt-drift-seal" };
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        if (route == "snapshots")
        {
            authority.Setup(r => r.ListRunManifestCompareSlicesAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                    It.Is<IReadOnlyList<Guid>>(ids => ids.Count == 1 && ids[0] == runId), It.IsAny<CancellationToken>()))
                .Callback(() => (runVisibleInScope && shareGranted).Should().BeTrue())
                .ReturnsAsync([new RunManifestCompareSliceDto { RunId = runId, Run = run, GoldenManifest = manifest }]);
        }
        else
        {
            authority.Setup(r => r.GetRunDetailForManifestCompareAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                    runId, It.IsAny<CancellationToken>()))
                .Callback(() => (runVisibleInScope && shareGranted).Should().BeTrue())
                .ReturnsAsync(new RunDetailDto { Run = run, GoldenManifest = manifest });
        }

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(runs.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(snapshots.Object);
            services.AddSingleton(diffs.Object);
            services.AddSingleton(reconciliations.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        string path = route switch
        {
            "snapshots" => "snapshots",
            "diffs" => $"snapshots/{snapshotA:D}/diffs",
            "inventory-rows" => $"snapshots/{snapshotA:D}/inventory-rows",
            _ => $"diffs/{diffId:D}/changes",
        };

        async Task<HttpResponseMessage> ReadAsync()
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "Drift reader", [ArchLucidRoles.Reader], tenant, workspace, project);
            using HttpRequestMessage request = new(HttpMethod.Get, $"/v1/infra-evidence/{path}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", tenant.ToString("D"));
            request.Headers.Add("x-workspace-id", workspace.ToString("D"));
            request.Headers.Add("x-project-id", project.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage corrupt = await ReadAsync();
        corrupt.StatusCode.Should().Be(HttpStatusCode.Conflict);
        authority.Invocations.Should().ContainSingle();

        authority.Invocations.Clear();
        shareGranted = false;
        using HttpResponseMessage revoked = await ReadAsync();
        revoked.StatusCode.Should().Be(HttpStatusCode.OK);
        (await revoked.Content.ReadAsStringAsync()).Should().NotContain(runId.ToString("D"));
        authority.VerifyNoOtherCalls();

        shares.Invocations.Clear();
        shareGranted = true;
        runVisibleInScope = false;
        using HttpResponseMessage outOfScope = await ReadAsync();
        outOfScope.StatusCode.Should().Be(HttpStatusCode.OK);
        (await outOfScope.Content.ReadAsStringAsync()).Should().NotContain(runId.ToString("D"));
        authority.VerifyNoOtherCalls();
        shares.VerifyNoOtherCalls();
    }

    private static bool SameScope(ScopeContext actual, ScopeContext expected) =>
        actual.TenantId == expected.TenantId && actual.WorkspaceId == expected.WorkspaceId && actual.ProjectId == expected.ProjectId;
}
