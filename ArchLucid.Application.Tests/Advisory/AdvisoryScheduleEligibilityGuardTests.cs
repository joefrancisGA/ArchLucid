using ArchLucid.Application.Advisory;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Advisory;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdvisoryScheduleEligibilityGuardTests
{
    [Fact]
    public async Task HasFinalizedReviewForProjectAsync_returns_true_when_committed_run_exists()
    {
        Mock<IAuthorityQueryService> authority = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        authority
            .Setup(x => x.GetLatestCommittedRunIdByManifestCreatedUtcAsync(scope, "default", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Guid.NewGuid());

        bool result = await AdvisoryScheduleEligibilityGuard.HasFinalizedReviewForProjectAsync(
            authority.Object,
            scope,
            null,
            CancellationToken.None);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HasFinalizedReviewForProjectAsync_returns_false_when_no_committed_run_exists()
    {
        Mock<IAuthorityQueryService> authority = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        authority
            .Setup(x => x.GetLatestCommittedRunIdByManifestCreatedUtcAsync(scope, "claims-intake", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        bool result = await AdvisoryScheduleEligibilityGuard.HasFinalizedReviewForProjectAsync(
            authority.Object,
            scope,
            " claims-intake ",
            CancellationToken.None);

        result.Should().BeFalse();
    }

    [Theory]
    [InlineData(null, "default")]
    [InlineData("", "default")]
    [InlineData("   ", "default")]
    [InlineData("project-a", "project-a")]
    public void NormalizeRunProjectSlug_uses_default_slug_when_blank(string? input, string expected)
    {
        AdvisoryScheduleEligibilityGuard.NormalizeRunProjectSlug(input).Should().Be(expected);
    }
}
