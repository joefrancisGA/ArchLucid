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

    private static RunExportRecord CreateExport(string compareRunId)
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
