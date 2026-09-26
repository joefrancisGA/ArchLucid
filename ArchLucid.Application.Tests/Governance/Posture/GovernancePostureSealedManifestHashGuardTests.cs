using ArchLucid.Application;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

using Xunit;

namespace ArchLucid.Application.Tests.Governance.Posture;

public sealed class GovernancePostureSealedManifestHashGuardTests
{
    [Fact]
    public async Task EnsureLatestCommittedRunSealedOrThrowAsync_skips_guard_when_run_summaries_are_null()
    {
        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(service => service.ListRunSummariesKeysetAsync(
                It.IsAny<string?>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => (null!, false, (string?)null));

        Func<Task> act = () => GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            runDetails.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
