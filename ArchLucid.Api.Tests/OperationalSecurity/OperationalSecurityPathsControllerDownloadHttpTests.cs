using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.ProductLine;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests.OperationalSecurity;

[Collection("ArchLucidEnvMutation")]
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class OperationalSecurityPathsControllerDownloadHttpTests(JwtLocalSigningWebAppFactory factory)
    : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [Fact]
    public async Task Download_reuses_scoped_report_json_and_denies_foreign_project_before_provenance_read()
    {
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
        };
        Guid snapshotId = Guid.NewGuid(), pathId = Guid.NewGuid(), legacyPathId = Guid.NewGuid();
        Guid explanationId = Guid.NewGuid(), resourceId = Guid.NewGuid(), rowId = Guid.NewGuid();
        var key = ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId);
        DateTime captured = new(2026, 11, 25, 1, 0, 0, DateTimeKind.Utc);
        const string version = "azure-inventory-public-network-access/1";
        const string coverageText = "The explicit Azure property only, for the cited resource and snapshot.";
        var observation = new PublicNetworkAccessVerification(
            resourceId, PublicNetworkAccessVerificationOutcome.Contradicted, snapshotId, captured)
        {
            Evidence = new(version, scope.TenantId, scope.WorkspaceId, scope.ProjectId, rowId, "publicNetworkAccess", 24),
        };
        var probe = new InventoryFalsificationProbe(InventoryFalsificationOutcome.Refuted, coverageText, observation);

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => new TenantRecord { Id = id, Tier = TenantTier.Standard });
        Mock<IAzureInventorySnapshotRepository> snapshots = new(MockBehavior.Strict);
        snapshots.Setup(r => r.TryGetBySnapshotIdAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext requested, Guid _, CancellationToken _) =>
                requested.TenantId == scope.TenantId && requested.WorkspaceId == scope.WorkspaceId &&
                requested.ProjectId == scope.ProjectId
                    ? new AzureInventorySnapshotRecord
                    {
                        SnapshotId = snapshotId, TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId, CapturedUtc = captured,
                    }
                    : null);

        Mock<ISecurityEvidencePathRepository> paths = new(MockBehavior.Strict);
        paths.Setup(r => r.ListBySnapshotAsync(key, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new() { PathId = pathId, SnapshotId = snapshotId, PathKind = PathKind.Privilege, PathConfidenceBand = PathConfidenceBand.Confirmed },
                new() { PathId = legacyPathId, SnapshotId = snapshotId, PathKind = PathKind.Privilege, PathConfidenceBand = PathConfidenceBand.Confirmed },
            ]);
        paths.Setup(r => r.ListHopEdgeTypesBySnapshotAsync(key, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        Mock<ISecurityEvidencePathRankRepository> ranks = new(MockBehavior.Strict);
        ranks.Setup(r => r.ListBySnapshotAsync(key, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new() { PathId = pathId, SnapshotId = snapshotId, RankOrder = 1 },
                new() { PathId = legacyPathId, SnapshotId = snapshotId, RankOrder = 2 },
            ]);
        Mock<ISecurityEvidencePathSearchCoverageRepository> coverage = new(MockBehavior.Strict);
        coverage.Setup(r => r.ListBySnapshotAsync(
                It.Is<ScopeContext>(s => s.TenantId == scope.TenantId && s.WorkspaceId == scope.WorkspaceId && s.ProjectId == scope.ProjectId),
                snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        Mock<ISecurityEvidencePathExplanationRepository> explanations = new(MockBehavior.Strict);
        explanations.Setup(r => r.ListLatestVerificationByPathsAsync(
                It.Is<ScopeContext>(s => s.TenantId == scope.TenantId && s.WorkspaceId == scope.WorkspaceId && s.ProjectId == scope.ProjectId),
                snapshotId, It.Is<IReadOnlyList<Guid>>(ids => ids.SequenceEqual(new[] { pathId, legacyPathId })),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([new(pathId, explanationId, captured.AddMinutes(1), probe)]);

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(tenants.Object);
            services.AddSingleton(snapshots.Object);
            services.AddSingleton(paths.Object);
            services.AddSingleton(ranks.Object);
            services.AddSingleton(coverage.Object);
            services.AddSingleton(explanations.Object);
        }));
        using HttpClient client = host.CreateClient();

        Task<HttpResponseMessage> ReadAsync(Guid projectId, bool download) =>
            SendAsync(projectId, $"/v1/operational-security/paths/report?snapshotId={snapshotId:D}" + (download ? "&download=true" : string.Empty));

        async Task<HttpResponseMessage> SendAsync(Guid projectId, string url)
        {
            string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(factory.PrivatePemForTests,
                JwtLocalSigningWebAppFactory.JwtLocalTestIssuer, JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
                "SecureNow report reader", [ArchLucidRoles.Reader], scope.TenantId, scope.WorkspaceId, projectId);
            using HttpRequestMessage request = new(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add(ProductLineHttpHeaderNames.Header, "security");
            request.Headers.Add("x-tenant-id", scope.TenantId.ToString("D"));
            request.Headers.Add("x-workspace-id", scope.WorkspaceId.ToString("D"));
            request.Headers.Add("x-project-id", projectId.ToString("D"));
            return await client.SendAsync(request);
        }

        using HttpResponseMessage inline = await ReadAsync(scope.ProjectId, download: false);
        inline.StatusCode.Should().Be(HttpStatusCode.OK);
        inline.Content.Headers.ContentDisposition.Should().BeNull();
        using HttpResponseMessage download = await ReadAsync(scope.ProjectId, download: true);
        download.StatusCode.Should().Be(HttpStatusCode.OK);
        (download.Headers.CacheControl?.NoStore).Should().BeTrue();
        download.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        var attachment = download.Content.Headers.ContentDisposition;
        attachment.Should().NotBeNull();
        attachment!.DispositionType.Should().Be("attachment");
        (attachment.FileName?.Trim('"')).Should().Be($"securenow-attack-path-report-{snapshotId:N}.json");

        using JsonDocument inlineJson = JsonDocument.Parse(await inline.Content.ReadAsStringAsync());
        using JsonDocument downloadJson = JsonDocument.Parse(await download.Content.ReadAsStringAsync());
        JsonElement.DeepEquals(inlineJson.RootElement, downloadJson.RootElement).Should().BeTrue();
        JsonElement entries = downloadJson.RootElement.GetProperty("inventoryVerifications");
        entries.GetArrayLength().Should().Be(1);
        JsonElement row = entries[0];
        row.GetProperty("pathId").GetGuid().Should().Be(pathId);
        row.GetProperty("explanationId").GetGuid().Should().Be(explanationId);
        JsonElement verification = row.GetProperty("verification");
        verification.GetProperty("coverage").GetString().Should().Be(coverageText);
        JsonElement outcome = verification.GetProperty("outcome");
        if (outcome.ValueKind == JsonValueKind.Number)
            outcome.GetInt32().Should().Be((int)InventoryFalsificationOutcome.Refuted);
        else
            outcome.GetString().Should().BeEquivalentTo(nameof(InventoryFalsificationOutcome.Refuted));
        JsonElement source = verification.GetProperty("verification");
        source.GetProperty("snapshotId").GetGuid().Should().Be(snapshotId);
        source.GetProperty("capturedUtc").GetDateTime().Should().Be(captured);
        source.GetProperty("evidence").GetProperty("verifierVersion").GetString().Should().Be(version);
        source.GetProperty("evidence").GetProperty("resourceRowId").GetGuid().Should().Be(rowId);

        using HttpResponseMessage foreign = await ReadAsync(Guid.NewGuid(), download: true);
        foreign.StatusCode.Should().Be(HttpStatusCode.NotFound);
        foreign.Content.Headers.ContentDisposition.Should().BeNull();
        (await foreign.Content.ReadAsStringAsync()).Should().NotContain(version);
        paths.Verify(r => r.ListBySnapshotAsync(key, It.IsAny<CancellationToken>()), Times.Exactly(2));
        explanations.Verify(r => r.ListLatestVerificationByPathsAsync(
            It.IsAny<ScopeContext>(), snapshotId, It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
