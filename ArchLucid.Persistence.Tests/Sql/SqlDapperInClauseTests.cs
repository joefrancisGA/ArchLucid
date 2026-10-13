using Dapper;

using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
public sealed class SqlDapperInClauseTests
{
    [Fact]
    public void AppendStringList_emits_numbered_placeholders_for_a_single_value()
    {
        DynamicParameters parameters = new();

        string clause = SqlDapperInClause.AppendStringList(parameters, "FindingId", ["sensitive-data-minimization-risk"]);

        clause.Should().Be("(@FindingId0)");
        clause.Should().NotContain("IN @FindingIds");
        parameters.ParameterNames.Should().Equal("FindingId0");
        parameters.Get<string>("FindingId0").Should().Be("sensitive-data-minimization-risk");
    }

    [Fact]
    public void AppendStringList_emits_comma_separated_placeholders_for_multiple_values()
    {
        DynamicParameters parameters = new();

        string clause = SqlDapperInClause.AppendStringList(parameters, "FindingId", ["f-1", "f-2"]);

        clause.Should().Be("(@FindingId0, @FindingId1)");
        parameters.Get<string>("FindingId0").Should().Be("f-1");
        parameters.Get<string>("FindingId1").Should().Be("f-2");
    }

    [Fact]
    public void AppendStringList_rejects_null_parameters()
    {
        Action act = () => SqlDapperInClause.AppendStringList(null!, "FindingId", ["f-1"]);

        act.Should().Throw<ArgumentNullException>().WithParameterName("parameters");
    }

    [Fact]
    public void AppendStringList_rejects_blank_prefix()
    {
        Action act = () => SqlDapperInClause.AppendStringList(new DynamicParameters(), "  ", ["f-1"]);

        act.Should().Throw<ArgumentException>().WithParameterName("parameterPrefix");
    }

    [Fact]
    public void AppendStringList_rejects_null_values()
    {
        Action act = () => SqlDapperInClause.AppendStringList(new DynamicParameters(), "FindingId", null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("values");
    }

    [Fact]
    public void AppendStringList_rejects_empty_values()
    {
        Action act = () => SqlDapperInClause.AppendStringList(new DynamicParameters(), "FindingId", []);

        act.Should().Throw<ArgumentException>().WithParameterName("values");
    }
}
