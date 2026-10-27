using ArchLucid.Application.Analysis;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.AzureExtractor.Stages;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorPreparedZipPersistStageTests
{
    [Fact]
    public async Task PersistAsync_forwards_subscription_name_to_snapshot_header()
    {
        Mock<IAzureInventorySnapshotHeaderService> snapshotHeader = new();
        snapshotHeader
            .Setup(s => s.TryCreatePendingFromPackageAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotHeaderCreateResult
            {
                Succeeded = true,
                SnapshotId = Guid.NewGuid(),
            });

        AzureExtractorPreparedZipPersistStage sut = CreateSut(snapshotHeader.Object);
        AzureExtractorPreparedZipValidatedContext context = CreateContext("Contoso Production");

        AzureExtractorIngestResult result = await sut.PersistAsync(context, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        snapshotHeader.Verify(
            s => s.TryCreatePendingFromPackageAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "Contoso Production",
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                "test-user",
                false,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompareQuality_PersistAsync_attaches_extractor_metadata_when_tasks_use_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("15151515-1515-1515-1515-151515151515");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString()).ToUpperInvariant();
        const string bundleId = "bundle-azure-extractor-legacy";

        ScopeContext scopeContext = new() { TenantId = Guid.NewGuid() };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scopeContext);

        InMemoryEvidenceBundleRepository evidenceRepository = new();
        await evidenceRepository.CreateAsync(
            new EvidenceBundle
            {
                EvidenceBundleId = bundleId,
                RequestDescription = "desc",
                Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            },
            CancellationToken.None);

        InMemoryAgentTaskRepository taskRepository = new();
        await taskRepository.CreateManyAsync(
            [
                new AgentTask
                {
                    TaskId = "legacy-azure-task",
                    RunId = legacyUpper,
                    AgentType = AgentType.Topology,
                    EvidenceBundleRef = bundleId,
                    CreatedUtc = DateTime.UtcNow,
                },
            ],
            CancellationToken.None);

        Mock<IAzureInventorySnapshotHeaderService> snapshotHeader = new();
        snapshotHeader
            .Setup(s => s.TryCreatePendingFromPackageAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotHeaderCreateResult
            {
                Succeeded = true,
                SnapshotId = Guid.NewGuid(),
            });

        Mock<IAzureExtractorPackageRepository> packages = new();
        packages
            .Setup(p => p.InsertAsync(It.IsAny<AzureExtractorPackageRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAzureInventorySnapshotMaterializer> materializer = new();
        materializer
            .Setup(m => m.TryMaterializePackageAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<byte[]>(),
                It.IsAny<AzureInventoryCaptureMethod>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotMaterializeResult
            {
                Succeeded = true,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                ResourceCount = 1,
            });

        AzureExtractorPreparedZipPersistStage sut = new(
            scopeProvider.Object,
            audit.Object,
            packages.Object,
            snapshotHeader.Object,
            materializer.Object,
            taskRepository,
            evidenceRepository,
            NullLogger<AzureExtractorPreparedZipPersistStage>.Instance);

        AzureExtractorPreparedZipValidatedContext context = CreateContext("Contoso Production", runGuid);

        AzureExtractorIngestResult result = await sut.PersistAsync(context, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        EvidenceBundle? updated = await evidenceRepository.GetByIdAsync(bundleId, CancellationToken.None);
        updated.Should().NotBeNull();
        updated!.Metadata.Should().ContainKey(AzureExtractorEvidenceBundleMerger.MetadataPackageIdKey);
    }

    [Fact]
    public async Task PersistAsync_forwards_null_when_subscription_name_is_guid()
    {
        Mock<IAzureInventorySnapshotHeaderService> snapshotHeader = new();
        snapshotHeader
            .Setup(s => s.TryCreatePendingFromPackageAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotHeaderCreateResult
            {
                Succeeded = true,
                SnapshotId = Guid.NewGuid(),
            });

        AzureExtractorPreparedZipPersistStage sut = CreateSut(snapshotHeader.Object);
        AzureExtractorPreparedZipValidatedContext context = CreateContext("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        AzureExtractorIngestResult result = await sut.PersistAsync(context, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        snapshotHeader.Verify(
            s => s.TryCreatePendingFromPackageAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                null,
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static AzureExtractorPreparedZipPersistStage CreateSut(IAzureInventorySnapshotHeaderService snapshotHeader)
    {
        Mock<IScopeContextProvider> scope = new();
        Mock<IAuditService> audit = new();
        Mock<IAzureExtractorPackageRepository> packages = new();
        Mock<IAzureInventorySnapshotMaterializer> materializer = new();
        materializer
            .Setup(m => m.TryMaterializePackageAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<byte[]>(),
                It.IsAny<AzureInventoryCaptureMethod>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotMaterializeResult
            {
                Succeeded = true,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                ResourceCount = 1,
            });

        return new AzureExtractorPreparedZipPersistStage(
            scope.Object,
            audit.Object,
            packages.Object,
            snapshotHeader,
            materializer.Object,
            new Mock<IAgentTaskRepository>().Object,
            new Mock<IEvidenceBundleRepository>().Object,
            NullLogger<AzureExtractorPreparedZipPersistStage>.Instance);
    }

    private static AzureExtractorPreparedZipValidatedContext CreateContext(string? subscriptionName, Guid? runId = null)
    {
        AzureExtractorNormalizedManifest manifest = new(
            1,
            "1.0",
            DateTimeOffset.Parse("2026-05-06T13:01:02Z"),
            "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            subscriptionName,
            "/subscriptions/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            [],
            "test",
            "{}");

        return new AzureExtractorPreparedZipValidatedContext
        {
            ZipBytes = [1, 2, 3],
            SafeName = "package.zip",
            Manifest = manifest,
            Scope = new ScopeContext { TenantId = Guid.NewGuid() },
            Actor = "test-user",
            RunId = runId,
        };
    }
}
