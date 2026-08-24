using ArchLucid.Application;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunSummaryOnePagerExportServiceTests
{
    [Fact]
    public async Task GenerateMarkdownAsync_throws_conflict_when_broken_manifest_reference()
    {
        const string runId = "cccccccccccccccccccccccccccccccc";

        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v-missing"
            },
            Manifest = null,
            HasBrokenManifestReference = true
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        Mock<IOptionsMonitor<GenerateRunSummaryOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new GenerateRunSummaryOptions { Enabled = true });

        RunSummaryOnePagerExportService sut = new(
            runDetails.Object,
            Mock.Of<IAgentCompletionClient>(),
            options.Object);

        Func<Task> act = () => sut.GenerateMarkdownAsync(runId, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*broken manifest reference*");
    }
}
