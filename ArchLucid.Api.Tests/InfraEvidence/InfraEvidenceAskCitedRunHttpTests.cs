using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.InfraEvidence.Ask;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Llm;
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
public sealed class InfraEvidenceAskCitedRunHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Theory]
    [InlineData("run")]
    [InlineData("snapshot")]
    [InlineData("both")]
    public async Task Ask_checks_current_run_access_before_seal_and_evidence_reads(string selector)
    {
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
        };
        Guid runId = Guid.NewGuid(), architectureId = Guid.NewGuid(), snapshotId = Guid.NewGuid();
        bool explicitRun = selector != "snapshot";
        bool explicitSnapshot = selector != "run";
        InfraEvidenceAskRequest query = new()
        {
            Question = "What changed?",
            RunId = explicitRun ? runId : null,
            SnapshotId = explicitSnapshot ? snapshotId : null,
            UseSimulator = true,
        };

        bool runInScope = true, shareGranted = true, snapshotInScope = true, corruptSeal = true;
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
        shares.Setup(s => s.EvaluateAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), architectureId, It.IsAny<string?>(),
                It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = shareGranted });
        Mock<IAzureInventorySnapshotRepository> snapshots = new(MockBehavior.Strict);
        snapshots.Setup(r => r.TryGetBySnapshotIdAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => snapshotInScope ? snapshot : null);

        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new(MockBehavior.Strict);
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(scope.TenantId, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([runId, runId]);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(r => r.GetRunDetailForManifestCompareAsync(It.Is<ScopeContext>(s => SameScope(s, scope)),
                runId, It.IsAny<CancellationToken>()))
            .Callback(() =>
            {
                shares.Verify(s => s.EvaluateAsync(It.Is<ScopeContext>(actual => SameScope(actual, scope)),
                    architectureId, It.IsAny<string?>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(),
                    It.IsAny<CancellationToken>()), Times.Once);
                (runInScope && shareGranted && snapshotInScope).Should().BeTrue();
            })
            .ReturnsAsync(() => new RunDetailDto
            {
                Run = run,
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    ManifestHash = corruptSeal ? "fixture-corrupt-ask-seal" : SealedManifestHashTestSupport.DefaultHash,
                },
            });

        Mock<IInfraEvidenceAskEvidenceCollector> collector = new(MockBehavior.Strict);
        collector.Setup(c => c.CollectAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), It.IsAny<InfraEvidenceAskRequest>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new InfraEvidenceAskEvidenceBundle { TopicKind = InfraEvidenceAskTopicKinds.ResourceOverview });
        Mock<IAgentCompletionClient> llm = new(MockBehavior.Strict);
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
            services.AddSingleton(collector.Object);
            services.AddSingleton(llm.Object);
            services.AddSingleton(SealedManifestHashTestSupport.CreateManifestHashService());
        }));
        using HttpClient client = host.CreateClient();

        async Task<HttpResponseMessage> AskAsync()
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "Infra Evidence Ask reader", [ArchLucidRoles.Reader], scope.TenantId, scope.WorkspaceId, scope.ProjectId);
            using HttpRequestMessage request = new(HttpMethod.Post, "/v1/infra-evidence/ask");
            request.Content = JsonContent.Create(query);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("x-tenant-id", scope.TenantId.ToString("D"));
            request.Headers.Add("x-workspace-id", scope.WorkspaceId.ToString("D"));
            request.Headers.Add("x-project-id", scope.ProjectId.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage corrupt = await AskAsync();
        corrupt.StatusCode.Should().Be(HttpStatusCode.Conflict);
        authority.Invocations.Should().ContainSingle();
        collector.VerifyNoOtherCalls();

        authority.Invocations.Clear();
        shares.Invocations.Clear();
        corruptSeal = false;
        using HttpResponseMessage valid = await AskAsync();
        await VerifyInsufficientAsync(valid);
        authority.Invocations.Should().ContainSingle();
        shares.Invocations.Should().ContainSingle();
        collector.Invocations.Should().ContainSingle();

        authority.Invocations.Clear();
        collector.Invocations.Clear();
        reconciliations.Invocations.Clear();
        shareGranted = false;
        using HttpResponseMessage revoked = await AskAsync();
        await VerifyInsufficientAsync(revoked);
        authority.VerifyNoOtherCalls();
        collector.Invocations.Should().HaveCount(explicitRun ? 0 : 1);
        reconciliations.Invocations.Should().HaveCount(explicitRun ? 0 : 1);

        shares.Invocations.Clear();
        collector.Invocations.Clear();
        shareGranted = true;
        runInScope = false;
        using HttpResponseMessage unavailable = await AskAsync();
        await VerifyInsufficientAsync(unavailable);
        (await unavailable.Content.ReadAsStringAsync()).Should().Be(await revoked.Content.ReadAsStringAsync());
        authority.VerifyNoOtherCalls();
        shares.VerifyNoOtherCalls();
        collector.Invocations.Should().HaveCount(explicitRun ? 0 : 1);

        if (explicitSnapshot)
        {
            collector.Invocations.Clear();
            reconciliations.Invocations.Clear();
            runInScope = true;
            snapshotInScope = false;
            using HttpResponseMessage unavailableSnapshot = await AskAsync();
            await VerifyInsufficientAsync(unavailableSnapshot);
            authority.VerifyNoOtherCalls();
            reconciliations.VerifyNoOtherCalls();
            collector.VerifyNoOtherCalls();
        }

        llm.VerifyNoOtherCalls();
    }

    private static bool SameScope(ScopeContext actual, ScopeContext expected) =>
        actual.TenantId == expected.TenantId && actual.WorkspaceId == expected.WorkspaceId && actual.ProjectId == expected.ProjectId;

    private static async Task VerifyInsufficientAsync(HttpResponseMessage response)
    {
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        InfraEvidenceAskResponse? answer = await response.Content.ReadFromJsonAsync<InfraEvidenceAskResponse>();
        answer.Should().NotBeNull();
        answer!.InsufficientEvidence.Should().BeTrue();
        answer.Citations.Should().BeEmpty();
    }
}
