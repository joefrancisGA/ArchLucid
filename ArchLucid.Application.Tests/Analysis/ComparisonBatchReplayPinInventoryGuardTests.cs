using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Suite", "Core")]
public sealed class ComparisonBatchReplayPinInventoryGuardTests
{
    [Fact]
    public async Task EnsureEndToEndReplayPairReady_loads_run_pair_when_comparison_type_has_legacy_casing_and_regenerate_mode()
    {
        const string leftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string rightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "dddddddddddddddddddddddddddddddd",
            ComparisonType = "END-TO-END-REPLAY",
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
        };

        Mock<ICompareRunsApplicationFacade> compareRuns = new();
        compareRuns
            .Setup(f => f.LoadScopedRunPairAsync(leftRunId, rightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ScopedRunPairLoadResult { Outcome = ScopedRunPairLoadOutcome.Success });

        await ComparisonBatchReplayPinInventoryGuard.EnsureEndToEndReplayPairReadyOrThrowAsync(
            record,
            replayMode: "regenerate",
            compareRuns.Object,
            CancellationToken.None);

        compareRuns.Verify(
            f => f.LoadScopedRunPairAsync(leftRunId, rightRunId, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
