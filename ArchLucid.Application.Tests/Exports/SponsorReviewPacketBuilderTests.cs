using ArchLucid.Application.Exports;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SponsorReviewPacketBuilderTests
{
    private const string RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    [Fact]
    public async Task BuildMarkdownAsync_returns_null_when_run_is_not_committed()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = RunId,
                Status = ArchitectureRunStatus.WaitingForResults
            },
            Manifest = null
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(x => x.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        SponsorReviewPacketBuilder sut = CreateSut(runDetails.Object);

        string? markdown = await sut.BuildMarkdownAsync(RunId, CancellationToken.None);

        markdown.Should().BeNull();
    }

    [Fact]
    public async Task BuildMarkdownAsync_returns_null_when_manifest_reference_is_broken()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = RunId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v-missing"
            },
            Manifest = null,
            HasBrokenManifestReference = true
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(x => x.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        SponsorReviewPacketBuilder sut = CreateSut(runDetails.Object);

        string? markdown = await sut.BuildMarkdownAsync(RunId, CancellationToken.None);

        markdown.Should().BeNull();
    }

    private static SponsorReviewPacketBuilder CreateSut(IRunDetailQueryService runDetails)
    {
        Mock<ISponsorRoiSummaryService> roi = new();
        roi.Setup(x => x.BuildAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SponsorRoiSummaryResponse());

        Mock<IArchitectureDecisionRegisterService> decisions = new();
        decisions
            .Setup(x => x.GetRegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<ArchitectureDecisionRegisterQueryOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureDecisionRegisterResponse());

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(x => x.GetCurrentScope()).Returns(new ScopeContext());

        return new SponsorReviewPacketBuilder(
            runDetails,
            roi.Object,
            decisions.Object,
            scope.Object);
    }
}
