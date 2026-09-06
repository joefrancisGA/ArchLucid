using ArchLucid.Application;
using ArchLucid.Application.Exports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunSummaryOnePagerExportServiceFeatureFlagTests
{
    [Fact]
    public async Task GenerateMarkdownAsync_when_disabled_throws_conflict()
    {
        Mock<IOptionsMonitor<GenerateRunSummaryOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new GenerateRunSummaryOptions { Enabled = false });

        RunSummaryOnePagerExportService sut = new(
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IAgentCompletionClient>(),
            options.Object,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            Mock.Of<ArchLucid.Persistence.Data.Repositories.IAgentExecutionTraceRepository>(),
            Mock.Of<IConfiguration>());

        Func<Task> act = () => sut.GenerateMarkdownAsync("run-1", CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*GenerateRunSummary*");
    }
}
