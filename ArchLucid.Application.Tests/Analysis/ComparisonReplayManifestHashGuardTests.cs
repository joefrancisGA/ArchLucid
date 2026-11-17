using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Suite", "Core")]
public sealed class ComparisonReplayManifestHashGuardTests
{
    [Fact]
    public async Task EnsureReplaySealedManifestHashes_throws_for_legacy_e2e_type_casing_when_golden_manifest_missing()
    {
        const string leftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string rightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cccccccccccccccccccccccccccccccc",
            ComparisonType = "END-TO-END-REPLAY",
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        Func<Task> act = () => ComparisonReplayManifestHashGuard.EnsureReplaySealedManifestHashesOrThrowAsync(
            record,
            ComparisonReplayMode.Verify,
            authority.Object,
            Mock.Of<IManifestHashService>(),
            scope.Object,
            Mock.Of<IRunExportRecordRepository>(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }
}
