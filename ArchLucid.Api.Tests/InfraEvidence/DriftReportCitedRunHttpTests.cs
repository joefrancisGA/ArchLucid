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
public sealed class DriftReportCitedRunHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Drift_report_authorizes_both_snapshots_without_mutating_approvals(bool citeSecondSnapshot)
    {
        Guid tenant = ScopeIds.DefaultTenant, workspace = ScopeIds.DefaultWorkspace, project = ScopeIds.DefaultProject;
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid(), diffId = Guid.NewGuid();
        Guid snapshotA = Guid.NewGuid(), snapshotB = Guid.NewGuid();
        Guid citedSnapshot = citeSecondSnapshot ? snapshotB : snapshotA;
        ScopeContext scope = new() { TenantId = tenant, WorkspaceId = workspace, ProjectId = project };

        bool runVisibleInScope = true;
        bool shareGranted = true;
        bool diffInScope = true;
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

        AzureInventoryDiffSummaryRecord diff = new() { DiffId = diffId, SnapshotAId = snapshotA, SnapshotBId = snapshotB };
        Mock<IAzureInventoryDiffRepository> diffs = new(MockBehavior.Strict);
        diffs.Setup(r => r.TryGetByDiffIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), diffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => diffInScope ? diff : null);
        diffs.Setup(r => r.ListChangesByDiffIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                diffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AzureInventoryChangeRecord>());
        Mock<IAzureInventoryDriftApprovalRepository> approvals = new(MockBehavior.Strict);
        approvals.Setup(r => r.ListActiveForDiffAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                diffId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AzureInventoryDriftApprovalRecord>());
        Mock<IAzureInventoryBaselineRepository> baselines = new(MockBehavior.Strict);
        baselines.Setup(r => r.ListByScopeAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                diff.SubscriptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AzureInventoryBaselineRecord>());

        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new(MockBehavior.Strict);
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(tenant,
                It.Is<Guid>(id => id == snapshotA || id == snapshotB), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, Guid id, CancellationToken _) => id == citedSnapshot ? [runId, runId] : []);

        ManifestDocument manifest = new() { RunId = runId, ManifestHash = "fixture-corrupt-drift-report-seal" };
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(r => r.GetRunDetailForManifestCompareAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                runId, It.IsAny<CancellationToken>()))
            .Callback(() =>
            {
                (runVisibleInScope && shareGranted).Should().BeTrue();
                shares.Verify(r => r.EvaluateAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), architectureId,
                    It.IsAny<string?>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(),
                    It.IsAny<CancellationToken>()), Times.Once);
            })
            .ReturnsAsync(new RunDetailDto { Run = run, GoldenManifest = manifest });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(runs.Object);
            services.AddSingleton(shares.Object);
            services.AddSingleton(approvals.Object);
            services.AddSingleton(baselines.Object);
            services.AddSingleton(diffs.Object);
            services.AddSingleton(reconciliations.Object);
            services.AddSingleton(authority.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> ReadAsync()
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "Drift reader", [ArchLucidRoles.Reader], tenant, workspace, project);
            using HttpRequestMessage request = new(HttpMethod.Get, $"/v1/infra-evidence/azure-inventory/diffs/{diffId:D}/drift-report");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", tenant.ToString("D"));
            request.Headers.Add("x-workspace-id", workspace.ToString("D"));
            request.Headers.Add("x-project-id", project.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage corrupt = await ReadAsync();
        corrupt.StatusCode.Should().Be(HttpStatusCode.Conflict);
        authority.Invocations.Should().ContainSingle();
        approvals.VerifyNoOtherCalls();
        baselines.VerifyNoOtherCalls();

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
        approvals.Verify(r => r.ListActiveForDiffAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
            diffId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        approvals.VerifyNoOtherCalls();

        diffInScope = false;
        reconciliations.Invocations.Clear();
        diffs.Invocations.Clear();
        approvals.Invocations.Clear();
        baselines.Invocations.Clear();
        using HttpResponseMessage foreignDiff = await ReadAsync();
        foreignDiff.StatusCode.Should().Be(HttpStatusCode.NotFound);
        diffs.Verify(r => r.TryGetByDiffIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
            diffId, It.IsAny<CancellationToken>()), Times.Once);
        diffs.VerifyNoOtherCalls();
        reconciliations.VerifyNoOtherCalls();
        authority.VerifyNoOtherCalls();
        approvals.VerifyNoOtherCalls();
        baselines.VerifyNoOtherCalls();
    }

    private static bool SameScope(ScopeContext actual, ScopeContext expected) =>
        actual.TenantId == expected.TenantId && actual.WorkspaceId == expected.WorkspaceId && actual.ProjectId == expected.ProjectId;
}
