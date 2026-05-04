using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

public sealed class ComparisonRecordRunIdSqlTests
{
    [Fact]
    public void ToCanonicalRunIdStringOrNull_uppercase_D_format_becomes_N()
    {
        Guid g = Guid.Parse("1c1d6210-6767-47c1-8bc6-08dd8a6b2c01");

        string? result =
            ComparisonRecordRunIdSql.ToCanonicalRunIdStringOrNull(g.ToString("D").ToUpperInvariant());

        result.Should().Be(g.ToString("N"));
    }

    [Fact]
    public void ToCanonicalRunIdStringOrNull_already_N_round_trips_same_value()
    {
        string n = Guid.NewGuid().ToString("N");

        ComparisonRecordRunIdSql.ToCanonicalRunIdStringOrNull(n).Should().Be(n);
    }

    [Fact]
    public void ToCanonicalRunIdStringOrNull_whitespace_returns_null()
    {
        ComparisonRecordRunIdSql.ToCanonicalRunIdStringOrNull("  ").Should().BeNull();
    }

    [Fact]
    public void NormalizeRunIdsForRead_canonicalizes_both_ids()
    {
        Guid left = Guid.NewGuid();
        Guid right = Guid.NewGuid();
        ComparisonRecord row = new ComparisonRecord
        {
            LeftRunId = left.ToString("D").ToUpperInvariant(),
            RightRunId = right.ToString("D").ToUpperInvariant()
        };

        ComparisonRecordRunIdSql.NormalizeRunIdsForRead(row);

        row.LeftRunId.Should().Be(left.ToString("N"));
        row.RightRunId.Should().Be(right.ToString("N"));
    }
}
