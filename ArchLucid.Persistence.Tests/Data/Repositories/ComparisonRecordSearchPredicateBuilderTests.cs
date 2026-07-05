using ArchLucid.Persistence.Data.Repositories;

using Dapper;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComparisonRecordSearchPredicateBuilderTests
{
    [Fact]
    public void AppendFilters_adds_no_conditions_when_all_filters_are_absent()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: null,
            rightRunId: null,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: null);

        conditions.Should().BeEmpty();
    }

    [Fact]
    public void AppendFilters_adds_comparison_type_condition_when_present()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: "ArchitectureDrift",
            leftRunId: null,
            rightRunId: null,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: null);

        conditions.Should().ContainSingle().Which.Should().Be("ComparisonType = @ComparisonType");
        ((string)parameters.Get<string>("@ComparisonType")).Should().Be("ArchitectureDrift");
    }

    [Theory]
    [InlineData("11111111-1111-1111-1111-111111111111", true)]
    [InlineData("not-a-guid", false)]
    public void AppendFilters_handles_valid_and_invalid_left_run_id(string leftRunId, bool expectGuidParameter)
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: leftRunId,
            rightRunId: null,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: null);

        if (expectGuidParameter)
            conditions.Should().ContainSingle().Which.Should().Be("LeftRunId = @LeftRunId");
        else
            conditions.Should().ContainSingle().Which.Should().Be("1 = 0");
    }

    [Theory]
    [InlineData("22222222-2222-2222-2222-222222222222", true)]
    [InlineData("also-not-a-guid", false)]
    public void AppendFilters_handles_valid_and_invalid_right_run_id(string rightRunId, bool expectGuidParameter)
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: null,
            rightRunId: rightRunId,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: null);

        if (expectGuidParameter)
            conditions.Should().ContainSingle().Which.Should().Be("RightRunId = @RightRunId");
        else
            conditions.Should().ContainSingle().Which.Should().Be("1 = 0");
    }

    [Fact]
    public void AppendFilters_adds_created_range_conditions_when_present()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();
        DateTime from = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 1, 31, 0, 0, 0, DateTimeKind.Utc);

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: null,
            rightRunId: null,
            createdFromUtc: from,
            createdToUtc: to,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: null);

        conditions.Should().BeEquivalentTo(["CreatedUtc >= @CreatedFromUtc", "CreatedUtc <= @CreatedToUtc"]);
    }

    [Fact]
    public void AppendFilters_adds_export_record_and_label_conditions_when_present()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: null,
            rightRunId: null,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: "left-export",
            rightExportRecordId: "right-export",
            label: "Baseline",
            tags: null);

        conditions.Should().BeEquivalentTo(
        [
            "LeftExportRecordId = @LeftExportRecordId",
            "RightExportRecordId = @RightExportRecordId",
            "Label = @Label",
        ]);
    }

    [Fact]
    public void AppendFilters_ignores_empty_tag_list()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: null,
            rightRunId: null,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: []);

        conditions.Should().BeEmpty();
    }

    [Fact]
    public void AppendFilters_adds_exists_condition_per_non_blank_tag()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: null,
            rightRunId: null,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: ["cost", "  ", "security"]);

        conditions.Should().HaveCount(2);
        conditions[0].Should().Contain("@Tag0").And.Contain("OPENJSON");
        conditions[1].Should().Contain("@Tag2").And.Contain("OPENJSON");
        ((string)parameters.Get<string>("@Tag0")).Should().Be("cost");
        ((string)parameters.Get<string>("@Tag2")).Should().Be("security");
    }
}
