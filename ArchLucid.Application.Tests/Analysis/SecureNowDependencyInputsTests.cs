using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowDependencyInputsTests
{
    [Theory]
    [InlineData(false, false, null)]
    [InlineData(true, false, "source_lineage_incompatible")]
    [InlineData(false, true, "incomplete_or_stale_inventory")]
    public async Task Carry_forward_requires_current_inventory_and_a_compatible_success_receipt(
        bool changePolicy, bool staleCapture, string? expected)
    {
        DateTimeOffset now = new(2026, 11, 27, 19, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid sourceId = Guid.NewGuid();
        Guid targetId = Guid.NewGuid();
        AzureInventorySnapshotRecord source = Capture(sourceId, now.UtcDateTime.AddHours(staleCapture ? -25 : -1));
        AzureInventorySnapshotRecord target = Capture(targetId, now.UtcDateTime);
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots.Setup(repo => repo.TryGetBySnapshotIdAsync(scope, sourceId, CancellationToken.None))
            .ReturnsAsync(source);
        Mock<ISecurityEvidencePathSearchCoverageRepository> coverage = new();
        coverage.Setup(repo => repo.ListBySnapshotAsync(scope, sourceId, CancellationToken.None)).ReturnsAsync([]);
        Mock<ISecurityEvidencePathRepository> paths = new();
        paths.Setup(repo => repo.ListWithHopsBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(ProjectScopeKey.From(scope), sourceId), CancellationToken.None)).ReturnsAsync([]);
        Mock<IAnalysisRecoveryRepository> checkpoints = new(MockBehavior.Strict);
        SecureNowDependencyInputs inputs = new(new AnalysisDependencyConfiguration(new ConfigurationBuilder().Build()),
            snapshots.Object, paths.Object, coverage.Object, Mock.Of<ISecurityAssetAssertionResolver>(),
            Mock.Of<ISecurityEvidencePathRankRepository>(), Mock.Of<IRemediationPatternRepository>(),
            checkpoints.Object, Mock.Of<IArchitectureDiagramReconciliationRepository>(), clock);

        if (!staleCapture)
        {
            SecureNowDependencyReceipt? receipt = await inputs.CreateReceiptAsync(
                scope, source, "v1", 24, true, CancellationToken.None);
            Assert.NotNull(receipt);
            string reference = JsonSerializer.Serialize(receipt);
            Assert.Null(await inputs.VerifyReportReceiptAsync(scope, source, reference, CancellationToken.None));
            Assert.Equal("stale_inventory_binding",
                await inputs.VerifyReportReceiptAsync(scope, target, reference, CancellationToken.None));
            Assert.Equal("stale_path_outputs",
                await inputs.VerifyReportReceiptAsync(scope, source,
                    JsonSerializer.Serialize(receipt with { Paths = "wrong-witness" }), CancellationToken.None));
            checkpoints.Setup(repo => repo.ReadAsync(
                    new AnalysisRecoveryStageKey(ProjectScopeKey.From(scope), "securenow", sourceId, "job"),
                    CancellationToken.None))
                .ReturnsAsync(new AnalysisRecoveryClaim { State = "succeeded", ResultReference = reference });
        }

        string? reason = await inputs.CarryForwardRejectionAsync(
            scope, target, sourceId, changePolicy ? "v2" : "v1", 24, CancellationToken.None);
        Assert.Equal(expected, reason);
        checkpoints.VerifyAll();

        static AzureInventorySnapshotRecord Capture(Guid id, DateTime capturedUtc) => new()
        {
            SnapshotId = id, SubscriptionId = "subscription", CapturedUtc = capturedUtc,
            CaptureStatus = AzureInventoryCaptureStatus.Succeeded, CompletenessScore = 1m, ContentHashSha256 = new byte[32]
        };
    }
}
