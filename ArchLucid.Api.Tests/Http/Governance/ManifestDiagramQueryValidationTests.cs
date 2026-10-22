using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestDiagramQueryValidationTests
{
    [Fact]
    public void ValidateLayout_accepts_null_layout()
    {
        GovernanceHttpValidation? validation = ManifestDiagramQueryValidation.ValidateLayout(null);

        validation.Should().BeNull();
    }

    [Fact]
    public void ValidateLayout_rejects_whitespace_only_layout()
    {
        GovernanceHttpValidation? validation = ManifestDiagramQueryValidation.ValidateLayout("   ");

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("layout");
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateRelationshipLabels_rejects_whitespace_only_value()
    {
        GovernanceHttpValidation? validation =
            ManifestDiagramQueryValidation.ValidateRelationshipLabels("   ");

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("relationshipLabels");
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void ValidateGroupBy_rejects_whitespace_only_value()
    {
        GovernanceHttpValidation? validation = ManifestDiagramQueryValidation.ValidateGroupBy("   ");

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("groupBy");
        validation.Message.Should().Contain("whitespace");
    }
}
