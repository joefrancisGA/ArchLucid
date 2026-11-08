using ArchLucid.Application.Analysis.ReplayComparison;
using ArchLucid.Contracts.Metadata;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReplayComparisonExportsDiffSliceTests
{
    [Fact]
    public void BuildExportPairingKey_treats_equivalent_compare_run_ids_as_same_pairing_key()
    {
        Guid compareRunId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        RunExportRecord dashedCompare = CreateExport(compareRunId: compareRunId.ToString("D"));
        RunExportRecord canonicalCompare = CreateExport(compareRunId: compareRunId.ToString("N"));

        string dashedKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(dashedCompare);
        string canonicalKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(canonicalCompare);

        dashedKey.Should().Be(canonicalKey);
    }

    [Fact]
    public void BuildExportPairingKey_treats_column_and_json_compare_run_id_as_same_pairing_key()
    {
        Guid compareRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        RunExportRecord columnAnchor = CreateExport(compareRunId: compareRunId.ToString("N"));
        RunExportRecord jsonAnchor = CreateExport(compareRunId: null);
        jsonAnchor.AnalysisRequestJson =
            $$"""{"includeAgentResultCompare":true,"compareRunId":"{{compareRunId.ToString("D")}}"}""";

        string columnKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(columnAnchor);
        string jsonKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(jsonAnchor);

        columnKey.Should().Be(jsonKey);
    }

    [Fact]
    public void BuildExportPairingKey_treats_column_and_json_template_profile_as_same_pairing_key()
    {
        RunExportRecord columnProfile = CreateExport(compareRunId: null);
        columnProfile.TemplateProfile = "sponsor";
        columnProfile.CompareManifestVersion = null;

        RunExportRecord jsonProfile = CreateExport(compareRunId: null);
        jsonProfile.TemplateProfile = null;
        jsonProfile.CompareManifestVersion = null;
        jsonProfile.AnalysisRequestJson = """{"templateProfile":"sponsor"}""";

        string columnKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(columnProfile);
        string jsonKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(jsonProfile);

        columnKey.Should().Be(jsonKey);
    }

    [Fact]
    public void BuildExportPairingKey_treats_whitespace_only_compare_run_column_as_json_anchor()
    {
        Guid compareRunId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        RunExportRecord whitespaceColumn = CreateExport(compareRunId: "   ");
        whitespaceColumn.CompareManifestVersion = null;
        whitespaceColumn.AnalysisRequestJson =
            $$"""{"includeAgentResultCompare":true,"compareRunId":"{{compareRunId.ToString("N")}}"}""";

        RunExportRecord canonicalColumn = CreateExport(compareRunId: compareRunId.ToString("N"));
        canonicalColumn.CompareManifestVersion = null;

        string whitespaceKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(whitespaceColumn);
        string canonicalKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(canonicalColumn);

        whitespaceKey.Should().Be(canonicalKey);
    }

    [Fact]
    public void BuildExportPairingKey_treats_column_and_json_compare_manifest_version_as_same_pairing_key()
    {
        RunExportRecord columnVersion = CreateExport(compareRunId: null);
        columnVersion.CompareManifestVersion = "v2";
        columnVersion.TemplateProfile = null;

        RunExportRecord jsonVersion = CreateExport(compareRunId: null);
        jsonVersion.CompareManifestVersion = null;
        jsonVersion.TemplateProfile = null;
        jsonVersion.AnalysisRequestJson = """{"includeManifestCompare":true,"compareManifestVersion":"v2"}""";

        string columnKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(columnVersion);
        string jsonKey = ReplayComparisonExportsDiffSlice.BuildExportPairingKey(jsonVersion);

        columnKey.Should().Be(jsonKey);
    }

    private static RunExportRecord CreateExport(string? compareRunId)
    {
        return new RunExportRecord
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = Guid.NewGuid().ToString("N"),
            ExportType = "architecture-analysis",
            Format = "docx",
            FileName = "report.docx",
            TemplateProfile = "consulting",
            CompareRunId = compareRunId,
            CompareManifestVersion = "v1",
            CreatedUtc = DateTime.UtcNow,
        };
    }
}
