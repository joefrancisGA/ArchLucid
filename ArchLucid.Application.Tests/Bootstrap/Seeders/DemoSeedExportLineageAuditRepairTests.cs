using ArchLucid.Application.Authority;
using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Bootstrap.Seeders;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DemoSeedExportLineageAuditRepairTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task TryEnsure_when_deps_null_throws()
    {
        Func<Task> act = () => DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            null!,
            Scope,
            Guid.NewGuid(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task TryEnsure_when_scope_null_throws()
    {
        Func<Task> act = () => DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            MakeDeps().Deps,
            null!,
            Guid.NewGuid(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task TryEnsure_when_run_detail_missing_does_not_write_audit()
    {
        RepairHarness harness = MakeDeps();
        Guid runId = Guid.NewGuid();
        harness.AuthorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        await DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            harness.Deps,
            Scope,
            runId,
            CancellationToken.None);

        harness.Audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryEnsure_when_golden_manifest_missing_does_not_write_audit()
    {
        RepairHarness harness = MakeDeps();
        Guid runId = Guid.NewGuid();
        harness.AuthorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = null });

        await DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            harness.Deps,
            Scope,
            runId,
            CancellationToken.None);

        harness.Audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryEnsure_when_sealed_hash_blank_does_not_write_audit()
    {
        RepairHarness harness = MakeDeps();
        Guid runId = Guid.NewGuid();
        ManifestDocument golden = CreateGolden(runId, manifestHash: "   ", ruleSetId: "pack-a");
        harness.AuthorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = golden });
        harness.Hasher.Setup(service => service.ComputeHash(golden)).Returns("recomputed");

        await DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            harness.Deps,
            Scope,
            runId,
            CancellationToken.None);

        harness.Audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryEnsure_when_hash_mismatch_does_not_write_audit()
    {
        RepairHarness harness = MakeDeps();
        Guid runId = Guid.NewGuid();
        ManifestDocument golden = CreateGolden(runId, manifestHash: "sealed-hash", ruleSetId: "pack-a");
        harness.AuthorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = golden });
        harness.Hasher.Setup(service => service.ComputeHash(golden)).Returns("other-hash");

        await DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            harness.Deps,
            Scope,
            runId,
            CancellationToken.None);

        harness.Audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryEnsure_when_sealed_hash_matches_writes_manifest_generated_anchor()
    {
        RepairHarness harness = MakeDeps();
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ManifestDocument golden = CreateGolden(runId, manifestHash: "AbC", ruleSetId: "pack-live", manifestId: manifestId);
        harness.AuthorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = golden });
        harness.Hasher.Setup(service => service.ComputeHash(golden)).Returns("abc");
        harness.Audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        await DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            harness.Deps,
            Scope,
            runId,
            CancellationToken.None);

        harness.Audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord =>
                    eventRecord.EventType == AuditEventTypes.ManifestGenerated
                    && eventRecord.RunId == runId
                    && eventRecord.ManifestId == manifestId
                    && eventRecord.DataJson.Contains("\"manifestHash\":\"abc\"", StringComparison.Ordinal)
                    && eventRecord.DataJson.Contains("\"ruleSetId\":\"pack-live\"", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryEnsure_when_rule_set_blank_uses_demo_authority_rule_set_id()
    {
        RepairHarness harness = MakeDeps();
        Guid runId = Guid.NewGuid();
        ManifestDocument golden = CreateGolden(runId, manifestHash: "sealed", ruleSetId: "  ");
        harness.AuthorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = golden });
        harness.Hasher.Setup(service => service.ComputeHash(golden)).Returns("sealed");
        harness.Audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        await DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            harness.Deps,
            Scope,
            runId,
            CancellationToken.None);

        harness.Audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord =>
                    eventRecord.DataJson.Contains("\"ruleSetId\":\"archlucid.authority.demo-seed\"", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryEnsure_when_audit_write_fails_throws_DurableAuditWriteFailedException()
    {
        RepairHarness harness = MakeDeps();
        Guid runId = Guid.NewGuid();
        ManifestDocument golden = CreateGolden(runId, manifestHash: "sealed", ruleSetId: "pack-a");
        harness.AuthorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = golden });
        harness.Hasher.Setup(service => service.ComputeHash(golden)).Returns("sealed");
        harness.Audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store unavailable"));

        Func<Task> act = () => DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
            harness.Deps,
            Scope,
            runId,
            CancellationToken.None);

        (await act.Should().ThrowAsync<DurableAuditWriteFailedException>())
            .Which.OperationLabel.Should().Contain(AuditEventTypes.ManifestGenerated);
        harness.Audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Exactly(3));
    }

    private static ManifestDocument CreateGolden(
        Guid runId,
        string manifestHash,
        string ruleSetId,
        Guid? manifestId = null) =>
        new()
        {
            RunId = runId,
            ManifestId = manifestId ?? Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ManifestHash = manifestHash,
            RuleSetId = ruleSetId,
        };

    private static RepairHarness MakeDeps()
    {
        Mock<IAuditService> audit = new();
        Mock<IAuthorityQueryService> authorityQuery = new();
        Mock<IManifestHashService> hasher = new();
        DemoSeedSeederDependencies deps = new(
            Mock.Of<IArchitectureRequestRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAuthorityCommittedManifestChainWriter>(),
            Mock.Of<IOptionsMonitor<DemoOptions>>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IRunExportRecordRepository>(),
            Mock.Of<IArtifactBundleRepository>(),
            audit.Object,
            authorityQuery.Object,
            hasher.Object,
            Mock.Of<IAuditRepository>(),
            Mock.Of<IGoldenManifestRepository>(),
            Mock.Of<IAuthorityFeasibilityVerdictComposer>(),
            Mock.Of<IActorContext>(),
            NullLogger.Instance);

        return new RepairHarness(deps, audit, authorityQuery, hasher);
    }

    private sealed record RepairHarness(
        DemoSeedSeederDependencies Deps,
        Mock<IAuditService> Audit,
        Mock<IAuthorityQueryService> AuthorityQuery,
        Mock<IManifestHashService> Hasher);
}
