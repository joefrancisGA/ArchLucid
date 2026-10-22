using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;

using Moq;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
public sealed class SqlSchemaBootstrapperSplitGoBatchesTests
{
    [Fact]
    public void SplitGoBatches_splits_on_go_lines_and_preserves_batches()
    {
        SqlSchemaBootstrapper sut = new(Mock.Of<ISqlConnectionFactory>(), "unused.sql");
        const string script = """
                              CREATE TABLE A (Id INT);
                              GO
                              CREATE TABLE B (Id INT);
                              GO

                              ALTER TABLE A ADD X INT;
                              """;

        IReadOnlyList<string> batches = sut.SplitGoBatches(script);

        batches.Should().HaveCount(3);
        batches[0].Should().Contain("CREATE TABLE A");
        batches[1].Should().Contain("CREATE TABLE B");
        batches[2].Should().Contain("ALTER TABLE A");
    }

    [Fact]
    public void SplitGoBatches_single_batch_when_no_go_separator()
    {
        SqlSchemaBootstrapper sut = new(Mock.Of<ISqlConnectionFactory>(), "unused.sql");

        IReadOnlyList<string> batches = sut.SplitGoBatches("SELECT 1;");

        batches.Should().ContainSingle().Which.Should().Be("SELECT 1;");
    }
}
