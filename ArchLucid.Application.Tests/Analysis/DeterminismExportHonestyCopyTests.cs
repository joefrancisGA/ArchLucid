using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DeterminismExportHonestyCopyTests
{
    [Fact]
    public void FormatManifestMatch_uses_sentence_not_yes_no()
    {
        DeterminismExportHonestyCopy.FormatManifestMatch(true)
            .Should()
            .Be(DeterminismExportHonestyCopy.ManifestMatchedBaseline);
        DeterminismExportHonestyCopy.FormatManifestMatch(false)
            .Should()
            .Be(DeterminismExportHonestyCopy.ManifestDidNotMatchBaseline);
    }

    [Fact]
    public void FormatTraceErrorMessage_labels_blank_errors_as_not_stored()
    {
        DeterminismExportHonestyCopy.FormatTraceErrorMessage(null, parseSucceeded: false)
            .Should()
            .Be(ArchitectureEvidenceRequestExport.TraceErrorNotStoredCopy);
        DeterminismExportHonestyCopy.FormatTraceErrorMessage(null, parseSucceeded: true)
            .Should()
            .Be(ArchitectureEvidenceRequestExport.TraceErrorNotStoredCopy);
        DeterminismExportHonestyCopy.FormatTraceErrorMessage("  timeout  ", parseSucceeded: false)
            .Should()
            .Be("  timeout  ");
    }
}
