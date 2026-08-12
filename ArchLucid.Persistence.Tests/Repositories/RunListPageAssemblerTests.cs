using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunListPageAssemblerTests
{
    [Fact]
    public void FromProbedRows_reports_no_further_page_when_the_probe_row_is_absent()
    {
        RunListPage page = RunListPageAssembler.FromProbedRows(Rows(2), pageSize: 3);

        page.Items.Should().HaveCount(2);
        page.HasMore.Should().BeFalse();
    }

    [Fact]
    public void FromProbedRows_reports_no_further_page_when_the_page_is_exactly_full()
    {
        RunListPage page = RunListPageAssembler.FromProbedRows(Rows(3), pageSize: 3);

        page.Items.Should().HaveCount(3);
        page.HasMore.Should().BeFalse();
    }

    /// <summary>The probe row must be trimmed, otherwise the caller returns one row more than it asked for.</summary>
    [Fact]
    public void FromProbedRows_trims_the_probe_row_and_reports_a_further_page()
    {
        RunListPage page = RunListPageAssembler.FromProbedRows(Rows(4), pageSize: 3);

        page.Items.Should().HaveCount(3);
        page.HasMore.Should().BeTrue();
        page.Items.Select(static run => run.Description).Should().Equal("run-0", "run-1", "run-2");
    }

    [Fact]
    public void FromProbedRows_returns_an_empty_page_for_no_rows()
    {
        RunListPage page = RunListPageAssembler.FromProbedRows([], pageSize: 3);

        page.Items.Should().BeEmpty();
        page.HasMore.Should().BeFalse();
    }

    [Fact]
    public void FromProbedRows_rejects_a_null_row_sequence()
    {
        Action assemble = static () => RunListPageAssembler.FromProbedRows(null!, pageSize: 3);

        assemble.Should().Throw<ArgumentNullException>();
    }

    private static List<RunRecord> Rows(int count) =>
        Enumerable.Range(0, count)
            .Select(static index => new RunRecord
            {
                RunId = Guid.NewGuid(),
                Description = $"run-{index}",
            })
            .ToList();
}
