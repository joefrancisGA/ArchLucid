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
    public void Rehydrate_corrupt_json_throws_InvalidOperationException()
    {
        RunExportRecord record = new() { ExportRecordId = "broken", AnalysisRequestJson = "{bad" };

        Action act = () => AnalysisExportRequestRehydrator.Rehydrate(record);

        act.Should().Throw<InvalidOperationException>().WithMessage("*broken*");
    }
}
