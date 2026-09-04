using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class RunExportLineageVerifierTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid()
    };

    [Fact]
    public async Task VerifyAsync_returns_null_when_run_missing()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        RunExportLineageVerifier sut = CreateSut(authority.Object, Mock.Of<IAuditRepository>(), Mock.Of<IAuditService>());

        RunExportLineageVerificationResult? result = await sut.VerifyAsync(Scope, Guid.NewGuid(), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task VerifyAsync_not_attested_when_no_golden_manifest()
    {
        Guid runId = Guid.NewGuid();
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = null
            });

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        RunExportLineageVerifier sut = CreateSut(authority.Object, Mock.Of<IAuditRepository>(), audit.Object);

        RunExportLineageVerificationResult result = (await sut.VerifyAsync(Scope, runId, CancellationToken.None))!;

        result.Status.Should().Be(RunExportLineageVerificationStatus.NotAttested);
        result.Detail.Should().Contain("no committed golden manifest");
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.RunExportLineageVerified
                    && e.RunId == runId
                    && e.DataJson!.Contains("NotAttested", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task VerifyAsync_match_when_recomputed_equals_audit_anchor()
    {
        Guid runId = Guid.NewGuid();
        ManifestDocument manifest = CreateManifest();
        string anchorHash = new ManifestHashService().ComputeHash(manifest);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = manifest
            });

        Mock<IAuditRepository> auditRepo = new();
        auditRepo
            .Setup(r => r.GetFilteredAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.Is<AuditEventFilter>(f =>
                    f.RunId == runId && f.EventType == AuditEventTypes.ManifestGenerated),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AuditEvent
                {
                    EventType = AuditEventTypes.ManifestGenerated,
                    RunId = runId,
                    OccurredUtc = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                    DataJson = JsonSerializer.Serialize(
                        new { manifestHash = anchorHash, ruleSetId = manifest.RuleSetId },
                        AuditJsonSerializationOptions.Instance)
                }
            ]);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        RunExportLineageVerifier sut = CreateSut(authority.Object, auditRepo.Object, audit.Object);

        RunExportLineageVerificationResult result = (await sut.VerifyAsync(Scope, runId, CancellationToken.None))!;

        result.Status.Should().Be(RunExportLineageVerificationStatus.Match);
        result.CommittedHash.Should().Be(anchorHash);
        result.RecomputedHash.Should().Be(anchorHash);
    }

    [Fact]
    public async Task VerifyAsync_mismatch_when_anchor_differs()
    {
        Guid runId = Guid.NewGuid();
        ManifestDocument manifest = CreateManifest();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = manifest
            });

        Mock<IAuditRepository> auditRepo = new();
        auditRepo
            .Setup(r => r.GetFilteredAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AuditEvent
                {
                    EventType = AuditEventTypes.ManifestGenerated,
                    RunId = runId,
                    DataJson = JsonSerializer.Serialize(
                        new { manifestHash = "DEADBEEF", ruleSetId = manifest.RuleSetId },
                        AuditJsonSerializationOptions.Instance)
                }
            ]);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        RunExportLineageVerifier sut = CreateSut(authority.Object, auditRepo.Object, audit.Object);

        RunExportLineageVerificationResult result = (await sut.VerifyAsync(Scope, runId, CancellationToken.None))!;

        result.Status.Should().Be(RunExportLineageVerificationStatus.Mismatch);
        result.CommittedHash.Should().Be("DEADBEEF");
        result.RecomputedHash.Should().NotBe("DEADBEEF");
    }

    [Fact]
    public async Task VerifyAsync_not_attested_when_no_manifest_generated_anchor()
    {
        Guid runId = Guid.NewGuid();
        ManifestDocument manifest = CreateManifest();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = manifest
            });

        Mock<IAuditRepository> auditRepo = new();
        auditRepo
            .Setup(r => r.GetFilteredAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AuditEvent>());

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        RunExportLineageVerifier sut = CreateSut(authority.Object, auditRepo.Object, audit.Object);

        RunExportLineageVerificationResult result = (await sut.VerifyAsync(Scope, runId, CancellationToken.None))!;

        result.Status.Should().Be(RunExportLineageVerificationStatus.NotAttested);
        result.RecomputedHash.Should().NotBeNullOrWhiteSpace();
        result.CommittedHash.Should().Be(manifest.ManifestHash);
    }

    [Fact]
    public async Task VerifyAsync_mismatch_when_sealed_manifest_hash_differs()
    {
        Guid runId = Guid.NewGuid();
        ManifestDocument manifest = CreateManifest();
        manifest.ManifestHash = new string('A', 64);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = manifest
            });

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        RunExportLineageVerifier sut = CreateSut(authority.Object, Mock.Of<IAuditRepository>(), audit.Object);

        RunExportLineageVerificationResult result = (await sut.VerifyAsync(Scope, runId, CancellationToken.None))!;

        result.Status.Should().Be(RunExportLineageVerificationStatus.Mismatch);
        result.CommittedHash.Should().Be(manifest.ManifestHash);
        result.RecomputedHash.Should().NotBe(manifest.ManifestHash);
    }

    private static ManifestDocument CreateManifest()
    {
        ManifestDocument manifest = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            RuleSetId = "rules",
            RuleSetVersion = "1.0",
            RuleSetHash = "rule-hash",
            Metadata = new ManifestMetadata { Name = "demo" }
        };

        manifest.ManifestHash = new ManifestHashService().ComputeHash(manifest);

        return manifest;
    }

    private static RunExportLineageVerifier CreateSut(
        IAuthorityQueryService authority,
        IAuditRepository auditRepository,
        IAuditService auditService)
    {
        return new RunExportLineageVerifier(
            authority,
            auditRepository,
            new ManifestHashService(),
            auditService);
    }
}
