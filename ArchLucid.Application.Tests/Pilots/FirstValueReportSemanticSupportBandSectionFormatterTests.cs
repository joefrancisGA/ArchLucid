using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FirstValueReportSemanticSupportBandSectionFormatterTests
{
    [Fact]
    public void HeuristicHonestyLead_is_not_llm_verified()
    {
        FirstValueReportSemanticSupportBandSectionFormatter.HeuristicHonestyLead.Should().Contain(
            "not LLM verified");
        FirstValueReportSemanticSupportBandSectionFormatter.HeuristicHonestyLead.Should().NotContain(
            "is LLM verified");
        FirstValueReportSemanticSupportBandSectionFormatter.HeuristicHonestyLead.Should().Contain(
            "Heuristic");
    }
}
