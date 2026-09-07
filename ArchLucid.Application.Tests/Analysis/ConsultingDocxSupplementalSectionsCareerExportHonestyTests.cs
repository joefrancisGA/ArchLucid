using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ConsultingDocxSupplementalSectionsCareerExportHonestyTests
{
    [Fact]
    public void AddCareerExportHonesty_includes_measurement_floor_copy_in_whitelabel_docx()
    {
        Body body = new();
        CareerExportCoverageHonestyInput input = new(
            new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: null,
                AnalysisStagesComplete: true,
                ActorNodeCount: 1),
            EnginesSucceeded: 4,
            WorkingDesk: true,
            ClassificationCounts: null,
            CatalogAdvisoryEngineFailureCount: 0,
            PreCommitGateEnabled: true,
            StructuralExecutionMode: StructuralExecutionMode.Simulator,
            IsSampleRun: false);

        ConsultingDocxSupplementalSections.AddCareerExportHonesty(body, input);

        string text = body.InnerText;

        text.Should().Contain("Career export honesty");
        text.Should().Contain("measurement floor");
    }

    [Fact]
    public void AddCareerExportHonesty_skips_section_when_input_is_null()
    {
        Body body = new();

        ConsultingDocxSupplementalSections.AddCareerExportHonesty(body, null);

        body.InnerText.Should().BeEmpty();
    }
}
