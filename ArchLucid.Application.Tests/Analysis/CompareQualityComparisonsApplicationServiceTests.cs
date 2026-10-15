using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class CompareQualityComparisonsApplicationServiceTests
{
    [Fact]
    public async Task CompareQuality_TryListByRunIdAsync_lists_records_when_query_uses_dashed_guid_and_persisted_left_uses_n_format()
    {
        Guid runKey = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string canonicalRunId = runKey.ToString("N");
        string dashedRunId = runKey.ToString("D");

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-guid-list",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = canonicalRunId,
                RightRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(dashedRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = canonicalRunId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        IReadOnlyList<ComparisonRecord>? records =
            await sut.TryListByRunIdAsync(dashedRunId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-guid-list");
    }
}
