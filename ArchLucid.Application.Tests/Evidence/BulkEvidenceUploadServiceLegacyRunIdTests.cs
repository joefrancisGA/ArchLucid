using ArchLucid.Application.Analysis;
using ArchLucid.Application.Common;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
public sealed class BulkEvidenceUploadServiceLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_UploadBulkEvidenceAsync_updates_bundle_metadata_when_tasks_use_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("14141414-1414-1414-1414-141414141414");
        string runIdN = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runIdN).ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("bulk-uploader");

        RunRecord runRecord = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runRecord);

        const string bundleId = "bundle-bulk-legacy";
        InMemoryEvidenceBundleRepository evidenceBundleRepository = new();
        await evidenceBundleRepository.CreateAsync(
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
                    TaskId = "legacy-bulk-task",
                    RunId = legacyUpper,
                    AgentType = AgentType.Topology,
                    EvidenceBundleRef = bundleId,
                    CreatedUtc = DateTime.UtcNow,
                },
            ],
            CancellationToken.None);

        Mock<IRunStoredEvidenceFileRepository> storedEvidence = new();
        storedEvidence
            .Setup(r => r.InsertAsync(It.IsAny<RunStoredEvidenceFileRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArtifactBlobStore> blobStore = new();
        blobStore
            .Setup(b => b.WriteAsync("artifacts", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("https://example.test/blob");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        BulkEvidenceUploadService sut = new(
            scopeProvider.Object,
            actorContext.Object,
            auditService.Object,
            runRepository.Object,
            taskRepository,
            evidenceBundleRepository,
            storedEvidence.Object,
            blobStore.Object,
            Mock.Of<IZipEvidenceExpanderService>(),
            Mock.Of<IEvidenceAddedIncrementalReReviewCoordinator>(),
            Options.Create(new EvidenceBulkUploadOptions { EvidenceBulkUploadMaxFiles = 10 }),
            NullLogger<BulkEvidenceUploadService>.Instance);

        Mock<IFormFile> file = new();
        file.Setup(f => f.Length).Returns(8);
        file.Setup(f => f.FileName).Returns("evidence.txt");
        file.Setup(f => f.ContentType).Returns("text/plain");
        file.Setup(f => f.OpenReadStream()).Returns(() => new MemoryStream(new byte[8]));

        FormFileCollection files = new() { file.Object };

        BulkEvidenceUploadResult result = await sut.UploadBulkEvidenceAsync(runGuid, files, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        EvidenceBundle? updated = await evidenceBundleRepository.GetByIdAsync(bundleId, CancellationToken.None);
        updated.Should().NotBeNull();
        updated!.Metadata[BulkEvidenceMetadataKeys.AttachedFileCountKey].Should().Be("1");
    }
}
