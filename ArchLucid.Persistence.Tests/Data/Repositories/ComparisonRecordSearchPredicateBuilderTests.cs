using ArchLucid.Persistence.Data.Repositories;

using Dapper;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComparisonRecordSearchPredicateBuilderTests
{
    [Fact]
    public void AppendFilters_adds_all_supported_predicates_when_inputs_present()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();
        Guid leftRunId = Guid.NewGuid();
        Guid rightRunId = Guid.NewGuid();
        DateTime createdFrom = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime createdTo = new(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc);

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: "manifest-diff",
            leftRunId: leftRunId.ToString("D"),
            rightRunId: rightRunId.ToString("N"),
            createdFromUtc: createdFrom,
            createdToUtc: createdTo,
            leftExportRecordId: "left-export",
            rightExportRecordId: "right-export",
            label: "release-1",
            tags: ["alpha", " ", "beta"]);

        conditions.Should().Contain("ComparisonType = @ComparisonType");
        conditions.Should().Contain("LeftRunId = @LeftRunId");
        conditions.Should().Contain("RightRunId = @RightRunId");
        conditions.Should().Contain("CreatedUtc >= @CreatedFromUtc");
        conditions.Should().Contain("CreatedUtc <= @CreatedToUtc");
        conditions.Should().Contain("LeftExportRecordId = @LeftExportRecordId");
        conditions.Should().Contain("RightExportRecordId = @RightExportRecordId");
        conditions.Should().Contain("Label = @Label");
        conditions.Should().ContainSingle(c => c.Contains("OPENJSON", StringComparison.Ordinal) && c.Contains("@Tag0"));
        conditions.Should().ContainSingle(c => c.Contains("OPENJSON", StringComparison.Ordinal) && c.Contains("@Tag2"));
        conditions.Should().NotContain(c => c.Contains("@Tag1", StringComparison.Ordinal));

        parameters.Get<string>("@ComparisonType").Should().Be("manifest-diff");
        parameters.Get<Guid>("@LeftRunId").Should().Be(leftRunId);
        parameters.Get<Guid>("@RightRunId").Should().Be(rightRunId);
        parameters.Get<DateTime>("@CreatedFromUtc").Should().Be(createdFrom);
        parameters.Get<DateTime>("@CreatedToUtc").Should().Be(createdTo);
        parameters.Get<string>("@LeftExportRecordId").Should().Be("left-export");
        parameters.Get<string>("@RightExportRecordId").Should().Be("right-export");
        parameters.Get<string>("@Label").Should().Be("release-1");
        parameters.Get<string>("@Tag0").Should().Be("alpha");
        parameters.Get<string>("@Tag2").Should().Be("beta");
    }

    [Fact]
    public void AppendFilters_invalid_run_id_adds_impossible_predicate()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: "not-a-guid",
            rightRunId: "also-bad",
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: null);

        conditions.Should().Equal("1 = 0", "1 = 0");
        parameters.ParameterNames.Should().BeEmpty();
    }

    [Fact]
    public void AppendFilters_empty_tags_list_is_no_op()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: "  ",
            leftRunId: " ",
            rightRunId: null,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: []);

        conditions.Should().BeEmpty();
        parameters.ParameterNames.Should().BeEmpty();
    }
}
