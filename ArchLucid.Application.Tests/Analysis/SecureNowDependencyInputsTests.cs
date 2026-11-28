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
    [InlineData("none", null)]
    [InlineData("policy", "source_lineage_incompatible")]
    [InlineData("stale", "incomplete_or_stale_inventory")]
    [InlineData("partial", "incomplete_or_stale_inventory")]
    [InlineData("legacy_receipt", "source_lineage_incompatible")]
    [InlineData("content", "changed_inventory")]
    [InlineData("capture_version", "negative_dependency_domain_changed")]
    [InlineData("collector_version", "negative_dependency_domain_changed")]
    [InlineData("capture_method", "negative_dependency_domain_changed")]
    [InlineData("resource_count", "negative_dependency_domain_changed")]
    [InlineData("relationship_count", "negative_dependency_domain_changed")]
    [InlineData("missing_collector", "negative_dependency_domain_unknown")]
    [InlineData("unknown_method", "negative_dependency_domain_unknown")]
    [InlineData("scope", "negative_dependency_domain_unknown")]
    public async Task Carry_forward_requires_current_inventory_and_a_compatible_success_receipt(
        string change, string? expected)
    {
        DateTimeOffset now = new(2026, 11, 27, 19, 0, 0, TimeSpan.Zero);
        FakeTimeProvider clock = new(now);
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid sourceId = Guid.NewGuid();
        Guid targetId = Guid.NewGuid();
        AzureInventorySnapshotRecord source = Capture(sourceId, now.UtcDateTime.AddHours(change == "stale" ? -25 : -1), "none");
        AzureInventorySnapshotRecord target = Capture(targetId, now.UtcDateTime, change);
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

        if (change is "none" or "policy" or "legacy_receipt")
        {
            SecureNowDependencyReceipt? receipt = await inputs.CreateReceiptAsync(
                scope, source, "v1", 24, true, CancellationToken.None);
            Assert.NotNull(receipt);
            Assert.Equal(SecureNowDependencyReceipt.CurrentSchema, receipt.Schema);
            if (change == "legacy_receipt")
                receipt = receipt with { Schema = 2 };
            checkpoints.Setup(repo => repo.ReadAsync(
                    new AnalysisRecoveryStageKey(ProjectScopeKey.From(scope), "securenow", sourceId, "job"),
                    CancellationToken.None))
                .ReturnsAsync(new AnalysisRecoveryClaim { State = "succeeded", ResultReference = JsonSerializer.Serialize(receipt) });
        }

        string? reason = await inputs.CarryForwardRejectionAsync(
            scope, target, sourceId, change == "policy" ? "v2" : "v1", 24, CancellationToken.None);
        Assert.Equal(expected, reason);
        checkpoints.VerifyAll();

        AzureInventorySnapshotRecord Capture(Guid id, DateTime capturedUtc, string scenario) => new()
        {
            SnapshotId = id, SubscriptionId = "subscription", CapturedUtc = capturedUtc,
            TenantId = scope.TenantId, ProjectId = scope.ProjectId,
            WorkspaceId = scenario == "scope" ? Guid.NewGuid() : scope.WorkspaceId,
            CaptureVersion = scenario == "capture_version" ? "capture-v2" : "capture-v1",
            CollectorVersion = scenario == "missing_collector" ? null :
                scenario == "collector_version" ? "collector-v2" : "collector-v1",
            CaptureMethod = scenario switch
            {
                "unknown_method" => AzureInventoryCaptureMethod.Unknown,
                "capture_method" => AzureInventoryCaptureMethod.CustomerScript,
                _ => AzureInventoryCaptureMethod.HostedReader
            },
            ResourceCount = scenario == "resource_count" ? 11 : 10,
            RelationshipCount = scenario == "relationship_count" ? 5 : 4,
            CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            CompletenessScore = scenario == "partial" ? 0.7m : 1m,
            ContentHashSha256 = scenario == "content" ? Enumerable.Repeat((byte)1, 32).ToArray() : new byte[32]
        };
    }
}
