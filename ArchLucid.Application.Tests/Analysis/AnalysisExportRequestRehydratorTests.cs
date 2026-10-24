using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class AnalysisExportRequestRehydratorTests
{
    [Fact]
    public void Rehydrate_null_record_throws()
    {
        Action act = () => AnalysisExportRequestRehydrator.Rehydrate(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Rehydrate_missing_json_returns_null()
    {
        RunExportRecord record = new() { ExportRecordId = "e1", AnalysisRequestJson = null };

        AnalysisExportRequestRehydrator.Rehydrate(record).Should().BeNull();
    }

    [Fact]
    public void Rehydrate_valid_json_returns_request()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "e1",
            AnalysisRequestJson = """{"templateProfile":"sponsor","includeEvidence":true}"""
        };

        PersistedAnalysisExportRequest? result = AnalysisExportRequestRehydrator.Rehydrate(record);

        result.Should().NotBeNull();
        result!.TemplateProfile.Should().Be("sponsor");
        result.IncludeEvidence.Should().BeTrue();
    }

    [Fact]
    public void Rehydrate_trims_padded_footer_attribution_when_other_whitelabel_fields_are_absent()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "e1",
            AnalysisRequestJson =
                """{"reviewBoardWhitelabelFooterAttribution":"  Prepared by Contoso  "}""",
        };

        PersistedAnalysisExportRequest? result = AnalysisExportRequestRehydrator.Rehydrate(record);

        result.Should().NotBeNull();
        result!.ReviewBoardWhitelabelFooterAttribution.Should().Be("Prepared by Contoso");
    }

    [Fact]
    public void Rehydrate_trims_padded_compare_run_id_and_whitelabel_strings_from_stored_json()
    {
        const string compareRunId = "cccccccccccccccccccccccccccccccc";
        RunExportRecord record = new()
        {
            ExportRecordId = "e1",
            AnalysisRequestJson =
                $$"""{"compareRunId":"  {{compareRunId}}  ","reviewBoardWhitelabelFirmDisplayName":"  Contoso Advisory  ","reviewBoardWhitelabelLogoBlobReference":"  blob://logo  "}""",
        };

        PersistedAnalysisExportRequest? result = AnalysisExportRequestRehydrator.Rehydrate(record);

        result.Should().NotBeNull();
        result!.CompareRunId.Should().Be(compareRunId);
        result.ReviewBoardWhitelabelFirmDisplayName.Should().Be("Contoso Advisory");
        result.ReviewBoardWhitelabelLogoBlobReference.Should().Be("blob://logo");
    }

    [Fact]
    public void Rehydrate_nulls_whitespace_only_audience_in_stored_json()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "e1",
            AnalysisRequestJson = """{"audience":"   "}""",
        };

        PersistedAnalysisExportRequest? result = AnalysisExportRequestRehydrator.Rehydrate(record);

        result.Should().NotBeNull();
        result!.Audience.Should().BeNull();
    }

    [Fact]
    public void Rehydrate_deserializes_determinism_iterations_from_json_number_token()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "e1",
            AnalysisRequestJson = """{"determinismIterations":3,"includeDeterminismCheck":true}""",
        };

        PersistedAnalysisExportRequest? result = AnalysisExportRequestRehydrator.Rehydrate(record);

        result.Should().NotBeNull();
        result!.DeterminismIterations.Should().Be(3);
    }

    [Fact]
    public void Rehydrate_clears_determinism_iterations_when_check_disabled_in_stored_json()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "e1",
            AnalysisRequestJson = """{"determinismIterations":3,"includeDeterminismCheck":false}""",
        };

        PersistedAnalysisExportRequest? result = AnalysisExportRequestRehydrator.Rehydrate(record);

        result.Should().NotBeNull();
        result!.IncludeDeterminismCheck.Should().BeFalse();
        result.DeterminismIterations.Should().Be(0);
    }

    [Fact]
    public void Rehydrate_corrupt_json_throws_InvalidOperationException()
    {
        RunExportRecord record = new() { ExportRecordId = "broken", AnalysisRequestJson = "{bad" };

        Action act = () => AnalysisExportRequestRehydrator.Rehydrate(record);

        act.Should().Throw<InvalidOperationException>().WithMessage("*broken*");
    }
}
