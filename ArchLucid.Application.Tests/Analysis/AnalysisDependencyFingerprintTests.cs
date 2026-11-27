using ArchLucid.Application.Analysis;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AnalysisDependencyFingerprintTests
{
    [Fact]
    public void Scope_and_exact_upstream_output_are_part_of_the_version()
    {
        var scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        var other = ProjectScopeKey.Create(scope.TenantId, scope.WorkspaceId, Guid.NewGuid());
        string first = AnalysisDependencyFingerprint.Create(scope, "findings", "rules-v1", "graph-1");

        Assert.Equal(first, AnalysisDependencyFingerprint.Create(scope, "findings", "rules-v1", "graph-1"));
        Assert.NotEqual(first, AnalysisDependencyFingerprint.Create(other, "findings", "rules-v1", "graph-1"));
        Assert.NotEqual(first, AnalysisDependencyFingerprint.Create(scope, "findings", "rules-v2", "graph-1"));
        Assert.NotEqual(first, AnalysisDependencyFingerprint.Create(scope, "findings", "rules-v1", "graph-2"));
    }

    [Theory]
    [InlineData("old", true, true, "stale_dependencies")]
    [InlineData("current", false, true, "output_missing")]
    [InlineData("current", true, false, "incomplete_dependency")]
    [InlineData("current", true, true, null)]
    public void Reuse_requires_compatible_readable_complete_output(string stored, bool readable, bool complete, string? reason)
    {
        AnalysisRecoveryClaim saved = new() { State = "succeeded", InputVersion = stored, ResultReference = "output" };

        Assert.Equal(reason, AnalysisDependencyFingerprint.Rejection(saved, "current", readable, complete));
    }

    [Fact]
    public void Ranking_policy_change_does_not_invalidate_path_or_drift_stages()
    {
        var job = new SecureNowAnalysisRecoveryJob
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(), SnapshotId = Guid.NewGuid(),
            InputVersion = "job-v2"
        };
        SecureNowRecoverySession session = new(Mock.Of<IAnalysisRecoveryRepository>(), job, 3,
            new FakeTimeProvider(), NullLogger.Instance, CancellationToken.None, versioned: true);
        session.BindSnapshot("capture", new SecureNowDependencyVersions("paths", "rank-v1", "cuts-v1", "drift"));
        string path = session.VersionFor("securenow.privilege");
        string drift = session.VersionFor("securenow.drift");
        string rank = session.VersionFor("securenow.ranking");

        session.BindSnapshot("capture", new SecureNowDependencyVersions("paths", "rank-v2", "cuts-v2", "drift"));

        Assert.Equal(path, session.VersionFor("securenow.privilege"));
        Assert.Equal(drift, session.VersionFor("securenow.drift"));
        Assert.NotEqual(rank, session.VersionFor("securenow.ranking"));
    }
}
