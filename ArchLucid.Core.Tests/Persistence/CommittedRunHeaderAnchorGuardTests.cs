using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence;

[Trait("Category", "Unit")]
public sealed class CommittedRunHeaderAnchorGuardTests
{
    [Fact]
    public void EnsureAnchorsUnchangedIfCommitted_allows_pre_commit_anchor_changes()
    {
        RunRecord persisted = CreateRun(goldenManifestId: null);
        RunRecord proposed = CreateRun(goldenManifestId: null);
        proposed.ProjectId = "mutated-project";

        Action act = () => CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, proposed);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureAnchorsUnchangedIfCommitted_allows_commit_transition()
    {
        RunRecord persisted = CreateRun(goldenManifestId: null);
        RunRecord proposed = CreateRun(goldenManifestId: Guid.NewGuid());

        Action act = () => CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, proposed);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureAnchorsUnchangedIfCommitted_allows_lifecycle_mutation_on_committed_run()
    {
        Guid manifestId = Guid.NewGuid();
        RunRecord persisted = CreateRun(goldenManifestId: manifestId);
        RunRecord proposed = CreateRun(goldenManifestId: manifestId);
        proposed.IsPinned = true;
        proposed.Description = "updated description";

        Action act = () => CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, proposed);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureAnchorsUnchangedIfCommitted_allows_manifest_version_casing_only_change_on_committed_run()
    {
        Guid manifestId = Guid.NewGuid();
        RunRecord persisted = CreateRun(goldenManifestId: manifestId);
        persisted.CurrentManifestVersion = "v1.0.0";
        RunRecord proposed = CreateRun(goldenManifestId: manifestId);
        proposed.CurrentManifestVersion = "V1.0.0";

        Action act = () => CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, proposed);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureAnchorsUnchangedIfCommitted_allows_otel_trace_id_casing_only_change_on_committed_run()
    {
        Guid manifestId = Guid.NewGuid();
        RunRecord persisted = CreateRun(goldenManifestId: manifestId);
        persisted.OtelTraceId = "0123456789abcdef0123456789abcdef";
        RunRecord proposed = CreateRun(goldenManifestId: manifestId);
        proposed.OtelTraceId = "0123456789ABCDEF0123456789ABCDEF";

        Action act = () => CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, proposed);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureAnchorsUnchangedIfCommitted_throws_when_anchor_mutates_on_committed_run()
    {
        Guid manifestId = Guid.NewGuid();
        RunRecord persisted = CreateRun(goldenManifestId: manifestId);
        RunRecord proposed = CreateRun(goldenManifestId: manifestId);
        proposed.ContextSnapshotId = Guid.NewGuid();

        Action act = () => CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, proposed);

        act.Should().Throw<RunEvidenceAnchorImmutableException>()
            .Which.RunId.Should().Be(persisted.RunId);
    }

    [Fact]
    public void EnsureAnchorsUnchangedIfCommitted_throws_when_engine_provenance_mutates_on_committed_run()
    {
        Guid manifestId = Guid.NewGuid();
        RunRecord persisted = CreateRun(goldenManifestId: manifestId);
        persisted.EngineProvenanceJson = """{"providerKind":"azure-openai"}""";
        RunRecord proposed = CreateRun(goldenManifestId: manifestId);
        proposed.EngineProvenanceJson = """{"providerKind":"deterministic"}""";

        Action act = () => CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, proposed);

        act.Should().Throw<RunEvidenceAnchorImmutableException>()
            .Which.RunId.Should().Be(persisted.RunId);
    }

    [Fact]
    public void EnsureAnchorsUnchangedIfCommitted_throws_when_governance_scope_mutates_on_committed_run()
    {
        Guid manifestId = Guid.NewGuid();
        RunRecord persisted = CreateRun(goldenManifestId: manifestId);
        persisted.GovernanceScopeJson = """{"packAssignments":[]}""";
        RunRecord proposed = CreateRun(goldenManifestId: manifestId);
        proposed.GovernanceScopeJson = """{"packAssignments":[{"policyPackId":"changed"}]}""";

        Action act = () => CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, proposed);

        act.Should().Throw<RunEvidenceAnchorImmutableException>()
            .Which.RunId.Should().Be(persisted.RunId);
    }

    private static RunRecord CreateRun(Guid? goldenManifestId)
    {
        return new RunRecord
        {
            RunId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            TenantId = Guid.Parse("10101010-1010-1010-1010-101010101010"),
            WorkspaceId = Guid.Parse("20202020-2020-2020-2020-202020202020"),
            ScopeProjectId = Guid.Parse("30303030-3030-3030-3030-303030303030"),
            ProjectId = "anchor-guard-test",
            CreatedUtc = new DateTime(2026, 6, 6, 12, 0, 0, DateTimeKind.Utc),
            ContextSnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            GoldenManifestId = goldenManifestId,
            StructuralExecutionMode = StructuralExecutionMode.Simulator
        };
    }
}
