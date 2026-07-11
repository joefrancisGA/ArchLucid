using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestProjectorTests
{
    private readonly DraftRequestProjector _projector = new();

    [Theory]
    [InlineData("Azure", CloudProvider.Azure)]
    [InlineData("Aws", CloudProvider.Aws)]
    [InlineData("Gcp", CloudProvider.Gcp)]
    [InlineData("None", CloudProvider.None)]
    public void Project_MapsCloudTargetAnswer_ToCloudProvider(string answer, CloudProvider expected)
    {
        DraftRequestDocument document = CreateDocument();
        document.QuestionAnswers[DraftIntakeQuestionKeys.CloudTarget] = answer;

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.CloudProvider.Should().Be(expected);
    }

    [Fact]
    public void Project_WhenCloudTargetMissing_UsesNone()
    {
        DraftRequestDocument document = CreateDocument();

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.CloudProvider.Should().Be(CloudProvider.None);
    }

    [Fact]
    public void Project_SetsDraftIntakeRequestSourceAndPreservesTransparencyTrail()
    {
        DraftRequestDocument document = CreateDocument();
        document.TransparencyTrail.Inferred.Add(new InferredTrailEntry
        {
            Key = "scale.requestsPerSecond",
            Value = "1200",
            Confidence = 45,
        });

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.RequestSource.Should().Be("draft-intake");
        request.IntakeTransparencyTrail.Should().NotBeNull();
        request.IntakeTransparencyTrail!.Inferred.Should().ContainSingle(i => i.Key == "scale.requestsPerSecond");
        request.Assumptions.Should().Contain(a => a.Contains("inferred:45", StringComparison.Ordinal));
    }

    [Fact]
    public void Project_WhenCloudTargetMalformed_UsesNoneWithoutThrowing()
    {
        DraftRequestDocument document = CreateDocument();
        document.QuestionAnswers[DraftIntakeQuestionKeys.CloudTarget] = "legacy-free-text-aws";

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.CloudProvider.Should().Be(CloudProvider.None);
    }

    private static DraftRequestDocument CreateDocument() => new()
    {
        FreeTextIntent = "Modernize the claims intake workflow with nightly batch API integration.",
    };
}
