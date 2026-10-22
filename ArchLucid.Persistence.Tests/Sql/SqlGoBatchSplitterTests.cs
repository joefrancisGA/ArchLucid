using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
public sealed class SqlGoBatchSplitterTests
{
    [Fact]
    public void Split_splits_on_go_lines_and_preserves_batches()
    {
        const string script = """
                              CREATE TABLE A (Id INT);
                              GO
                              CREATE TABLE B (Id INT);
                              GO

                              ALTER TABLE A ADD X INT;
                              """;

        IReadOnlyList<string> batches = SqlGoBatchSplitter.Split(script);

        batches.Should().HaveCount(3);
        batches[0].Should().Contain("CREATE TABLE A");
        batches[1].Should().Contain("CREATE TABLE B");
        batches[2].Should().Contain("ALTER TABLE A");
    }

    [Fact]
    public void Split_single_batch_when_no_go_separator()
    {
        IReadOnlyList<string> batches = SqlGoBatchSplitter.Split("SELECT 1;");

        batches.Should().ContainSingle().Which.Should().Be("SELECT 1;");
    }

    [Fact]
    public void Split_throws_when_script_null()
    {
        Action act = () => SqlGoBatchSplitter.Split(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("script");
    }
}
