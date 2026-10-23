using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class RunExportRecordPersistNormalizerTests
{
    [Fact]
    public void NormalizeLoadedRecord_trims_run_id_and_optional_string_columns()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "exp-1",
            RunId = "  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  ",
            ExportType = "  ArchitectureAnalysis  ",
            Format = "  Markdown  ",
            FileName = "  report.md  ",
            CompareManifestVersion = "  v1  ",
        };

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(record);

        record.RunId.Should().Be("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        record.ExportType.Should().Be("ArchitectureAnalysis");
        record.Format.Should().Be("Markdown");
        record.FileName.Should().Be("report.md");
        record.CompareManifestVersion.Should().Be("v1");
    }

    [Fact]
    public void NormalizeLoadedRecord_nulls_whitespace_only_optional_strings()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "exp-2",
            RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "report.md",
            Notes = "   ",
            TemplateProfile = "  ",
        };

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(record);

        record.Notes.Should().BeNull();
        record.TemplateProfile.Should().BeNull();
    }
}
