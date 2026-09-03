using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityRunLifecyclePhaseListResolverSeedHuntTests
{
    [Fact]
    public void ResolveFromRunHeader_committed_without_golden_manifest_is_not_not_started()
    {
        RunRecord header = new()
        {
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            GoldenManifestId = null,
            ContextSnapshotId = null,
        };

        AuthorityRunLifecyclePhase phase =
            AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header);

        phase.Should().NotBe(AuthorityRunLifecyclePhase.NotStarted);
    }
}
