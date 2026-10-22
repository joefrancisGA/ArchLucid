using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Agents;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class NoOpAgentOutputEvaluationResultRepositoryTests
{
    [Fact]
    public async Task AppendAsync_accepts_row()
    {
        NoOpAgentOutputEvaluationResultRepository sut = new();
        AgentOutputEvaluationResultRecord row = new()
        {
            RunId = Guid.NewGuid().ToString("D"),
            TraceId = Guid.NewGuid().ToString("D"),
            CaseId = "case-1",
            AgentType = AgentType.Topology,
            OverallScore = 0.9,
        };

        Func<Task> act = async () => await sut.AppendAsync(row, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task AppendAsync_null_row_throws()
    {
        NoOpAgentOutputEvaluationResultRepository sut = new();

        Func<Task> act = async () => await sut.AppendAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}
