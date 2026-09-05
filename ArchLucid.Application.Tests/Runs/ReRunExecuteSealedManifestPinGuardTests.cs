using System.Data;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ReRunExecuteSealedManifestPinGuardTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task EnsureReExecuteSourceReadyOrThrowAsync_skips_seal_checks_when_run_has_results_but_no_golden_manifest()
    {
        Guid runId = Guid.Parse("851472cf-81fa-4314-9679-1ab899ae8324");
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                GoldenManifestId = null,
            });

        Mock<IAgentResultRepository> results = new(MockBehavior.Strict);
        results
            .Setup(r => r.GetByRunIdAsync(
                Scope,
                runId.ToString("D"),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(),
                It.IsAny<IDbTransaction?>()))
            .ReturnsAsync(
            [
                new AgentResult
                {
                    ResultId = "result-1",
                    TaskId = "task-1",
                    RunId = runId.ToString("D"),
                },
            ]);

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IManifestHashService> hasher = new(MockBehavior.Strict);

        Func<Task> act = () => ReRunExecuteSealedManifestPinGuard.EnsureReExecuteSourceReadyOrThrowAsync(
            runId.ToString("D"),
            Scope,
            runs.Object,
            results.Object,
            authority.Object,
            hasher.Object,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
        authority.Verify(
            a => a.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EnsureReExecuteSourceReadyOrThrowAsync_still_requires_sealed_hash_when_golden_manifest_id_is_set()
    {
        Guid runId = Guid.Parse("6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501");
        Guid manifestId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        ManifestDocument manifest = new()
        {
            ManifestId = manifestId,
            RunId = runId,
            ManifestHash = "sealed-hash",
            RuleSetId = "r",
            RuleSetVersion = "1",
            RuleSetHash = "h",
            CommittedArtifactInventory =
            [
                new CommittedArtifactInventoryEntry
                {
                    ArtifactName = "artifact-bundle",
                    ContentType = "application/zip",
                    ContentHashSha256 = "abc",
                    Producer = "test",
                    CapturedUtc = new DateTime(2025, 3, 1, 12, 0, 0, DateTimeKind.Utc),
                },
            ],
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                GoldenManifestId = manifestId,
                PinnedPolicyPackIdsHashSha256 = [1],
                PinnedEvidencePackagePinsHashSha256 = [2],
                PinnedArchitectureVersionContentHashSha256 = [3],
                PinnedKnowledgeModelContentHashSha256 = [4],
            });

        Mock<IAgentResultRepository> results = new();
        results
            .Setup(r => r.GetByRunIdAsync(
                Scope,
                runId.ToString("D"),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(),
                It.IsAny<IDbTransaction?>()))
            .ReturnsAsync(
            [
                new AgentResult { ResultId = "r1", TaskId = "t1", RunId = runId.ToString("D") },
            ]);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = manifest,
            });

        Mock<IManifestHashService> hasher = new();
        hasher.Setup(h => h.ComputeHash(manifest)).Returns("sealed-hash");

        Func<Task> act = () => ReRunExecuteSealedManifestPinGuard.EnsureReExecuteSourceReadyOrThrowAsync(
            runId.ToString("D"),
            Scope,
            runs.Object,
            results.Object,
            authority.Object,
            hasher.Object,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
        hasher.Verify(h => h.ComputeHash(manifest), Times.Once);
    }
}
