using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class SqlRunIdMappingTests
{
    [Fact]
    public void ToSqlRunId_parses_contract_N_format()
    {
        Guid expected = Guid.NewGuid();

        Guid actual = SqlRunIdMapping.ToSqlRunId(expected.ToString("N"));

        actual.Should().Be(expected);
    }

    [Fact]
    public void ToSqlRunId_parses_hyphenated_format()
    {
        Guid expected = Guid.NewGuid();

        Guid actual = SqlRunIdMapping.ToSqlRunId(expected.ToString("D"));

        actual.Should().Be(expected);
    }

    [Fact]
    public void ToSqlRunId_trims_surrounding_whitespace()
    {
        Guid expected = Guid.NewGuid();

        Guid actual = SqlRunIdMapping.ToSqlRunId($"  {expected:N}  ");

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ToSqlRunId_rejects_blank_run_id(string runId)
    {
        Action act = () => SqlRunIdMapping.ToSqlRunId(runId);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ToSqlRunId_rejects_null_run_id()
    {
        Action act = () => SqlRunIdMapping.ToSqlRunId(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ToSqlRunId_rejects_non_guid_run_id()
    {
        Action act = () => SqlRunIdMapping.ToSqlRunId("not-a-guid");

        act.Should().Throw<ArgumentException>()
            .WithMessage("*UNIQUEIDENTIFIER*");
    }

    [Fact]
    public void ToContractRunId_emits_N_format()
    {
        Guid runId = Guid.NewGuid();

        string actual = SqlRunIdMapping.ToContractRunId(runId);

        actual.Should().Be(runId.ToString("N"));
        actual.Should().NotContain("-");
    }

    [Fact]
    public void ToContractRunId_round_trips_through_ToSqlRunId()
    {
        Guid runId = Guid.NewGuid();

        Guid actual = SqlRunIdMapping.ToSqlRunId(SqlRunIdMapping.ToContractRunId(runId));

        actual.Should().Be(runId);
    }
}
