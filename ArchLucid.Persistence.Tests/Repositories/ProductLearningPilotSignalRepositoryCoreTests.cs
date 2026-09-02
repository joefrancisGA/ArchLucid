using ArchLucid.Persistence.Coordination.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProductLearningPilotSignalRepositoryCoreTests
{
    [Fact]
    public void ClampListTake_caps_at_500()
    {
        ProductLearningPilotSignalRepositoryCore.ClampListTake(10_000).Should().Be(500);
    }

    [Fact]
    public void ValidateInsert_requires_subject_type()
    {
        Action act = () => ProductLearningPilotSignalRepositoryCore.ValidateInsert(
            new ArchLucid.Contracts.ProductLearning.ProductLearningPilotSignalRecord
            {
                SubjectType = " ",
                Disposition = "trusted",
            });

        act.Should().Throw<ArgumentException>();
    }
}
