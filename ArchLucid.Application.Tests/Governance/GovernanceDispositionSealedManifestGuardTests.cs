using ArchLucid.Application;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceDispositionSealedManifestGuardTests
{
    [Fact]
    public async Task EnsureRunSealedManifestHashOrThrowAsync_fails_closed_when_run_is_unknown()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailForManifestCompareAsync(
                scope,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        Func<Task> act = () => GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            authority.Object,
            Mock.Of<IManifestHashService>(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*committed golden manifest is missing*");
    }
}
