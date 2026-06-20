using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingInsightDensityColumnCodecTests
{
    [Fact]
    public void Round_trips_treatment_and_classification_storage()
    {
        FindingInsightDensityColumnCodec.ToTreatmentStorage(FindingTreatment.Promote).Should().Be((byte)0);
        FindingInsightDensityColumnCodec.FromTreatmentStorage(1).Should().Be(FindingTreatment.DemoteToChecklist);
        FindingInsightDensityColumnCodec.ToClassificationStorage(null).Should().BeNull();
        FindingInsightDensityColumnCodec.FromClassificationStorage(0)
            .Should()
            .Be(FindingClassification.DecisionGradeFinding);
    }
}
