using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityRunLifecyclePhaseListResolverTests
{
    [Fact]
    public void ResolveFromRunHeader_committed_without_golden_manifest_returns_not_started_for_in_memory_rows()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            GoldenManifestId = null,
            ContextSnapshotId = null,
        };

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header);

        // SQL dbo.Runs CHECK prevents Committed without GoldenManifestId on persisted rows; this guards in-memory/test fixtures only.
        phase.Should().Be(AuthorityRunLifecyclePhase.NotStarted);
    }
}
