using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureVersionServiceTests
{
    [Fact]
    public async Task EnsureRunVersionPinnedAsync_reuses_existing_content_hash()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid architectureId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        ArchitectureRequest request = new()
        {
            RequestId = Guid.NewGuid().ToString("N"),
            Description = "Governed workflow platform with auditable evidence trails and exportable reviews.",
            SystemName = "Claims intake",
        };

        byte[] contentHash = ArchitectureRunIdempotencyHashing.FingerprintRequest(request);

        InMemoryArchitectureVersionRepository versions = new();
        ArchitectureVersionRecord existingVersion = await versions.CreateAsync(
            scope,
            new ArchitectureVersionRecord
            {
                ArchitectureId = architectureId,
                VersionNumber = 1,
                ContentHashSha256 = contentHash,
                SourceRequestId = request.RequestId,
            },
            CancellationToken.None);

        Mock<IRunRepository> runs = new();
        RunRecord header = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runId,
            ProjectId = request.SystemName,
        };

        runs.Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        runs.Setup(r => r.UpdateAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask)
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (record, _, _, _) => header.ArchitectureVersionId = record.ArchitectureVersionId);

        ArchitectureVersionService sut = new(versions, runs.Object, NullLogger<ArchitectureVersionService>.Instance, TimeProvider.System);

        ArchitectureVersionRecord pinned = await sut.EnsureRunVersionPinnedAsync(
            scope,
            runId,
            architectureId,
            request,
            knowledgeModel: null,
            CancellationToken.None);

        pinned.Should().NotBeNull();
        pinned!.ArchitectureVersionId.Should().Be(existingVersion.ArchitectureVersionId);
        header.ArchitectureVersionId.Should().Be(existingVersion.ArchitectureVersionId);
        (await versions.GetLatestVersionNumberAsync(scope, architectureId, CancellationToken.None)).Should().Be(1);
    }

    [Fact]
    public async Task EnsureRunVersionPinnedAsync_creates_next_version_for_new_content()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid architectureId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        ArchitectureRequest firstRequest = new()
        {
            RequestId = Guid.NewGuid().ToString("N"),
            Description = "First revision of the governed workflow platform.",
            SystemName = "Claims intake",
        };

        ArchitectureRequest secondRequest = new()
        {
            RequestId = Guid.NewGuid().ToString("N"),
            Description = "Second revision adds stronger segmentation and audit controls.",
            SystemName = "Claims intake",
        };

        InMemoryArchitectureVersionRepository versions = new();
        Mock<IRunRepository> runs = new();
        RunRecord header = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runId,
            ProjectId = firstRequest.SystemName,
        };

        runs.Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        runs.Setup(r => r.UpdateAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask)
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (record, _, _, _) => header.ArchitectureVersionId = record.ArchitectureVersionId);

        ArchitectureVersionService sut = new(versions, runs.Object, NullLogger<ArchitectureVersionService>.Instance, TimeProvider.System);

        await sut.EnsureRunVersionPinnedAsync(scope, runId, architectureId, firstRequest, knowledgeModel: null, CancellationToken.None);
        ArchitectureVersionRecord second = await sut.EnsureRunVersionPinnedAsync(
            scope,
            runId,
            architectureId,
            secondRequest,
            knowledgeModel: null,
            CancellationToken.None);

        second.Should().NotBeNull();
        second.VersionNumber.Should().Be(2);
        header.ArchitectureVersionId.Should().Be(second.ArchitectureVersionId);
    }
}
