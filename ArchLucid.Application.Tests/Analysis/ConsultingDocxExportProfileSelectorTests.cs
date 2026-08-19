using ArchLucid.Application.Analysis;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConsultingDocxExportProfileSelectorTests
{
    [Fact]
    public void Resolve_uses_explicit_profile_when_catalog_contains_match()
    {
        Mock<IConsultingDocxTemplateProfileResolver> resolver = new();
        resolver.Setup(r => r.GetCatalog()).Returns(new ConsultingDocxTemplateProfileCatalog
        {
            Profiles =
            [
                new ConsultingDocxTemplateProfileInfo
                {
                    ProfileName = "sponsor",
                    ProfileDisplayName = "Sponsor Brief",
                },
            ],
        });
        Mock<IConsultingDocxTemplateRecommendationService> recommendation = new();
        ConsultingDocxExportProfileSelector sut = new(resolver.Object, recommendation.Object);

        ResolvedConsultingDocxExportProfile resolved = sut.Resolve(
            "sponsor",
            new ConsultingDocxProfileRecommendationRequest());

        resolved.SelectedProfileName.Should().Be("sponsor");
        resolved.SelectedProfileDisplayName.Should().Be("Sponsor Brief");
        resolved.WasAutoSelected.Should().BeFalse();
        recommendation.VerifyNoOtherCalls();
    }

    [Fact]
    public void Resolve_uses_recommendation_when_profile_not_specified()
    {
        Mock<IConsultingDocxTemplateProfileResolver> resolver = new();
        resolver.Setup(r => r.GetCatalog()).Returns(new ConsultingDocxTemplateProfileCatalog());
        Mock<IConsultingDocxTemplateRecommendationService> recommendation = new();
        recommendation.Setup(r => r.Recommend(It.IsAny<ConsultingDocxProfileRecommendationRequest>()))
            .Returns(new ConsultingDocxProfileRecommendation
            {
                RecommendedProfileName = "regulated",
                RecommendedProfileDisplayName = "Regulated Pack",
                Reason = "Compliance signals present.",
            });
        ConsultingDocxExportProfileSelector sut = new(resolver.Object, recommendation.Object);
        ConsultingDocxProfileRecommendationRequest request = new() { RegulatedEnvironment = true };

        ResolvedConsultingDocxExportProfile resolved = sut.Resolve(templateProfile: null, request);

        resolved.SelectedProfileName.Should().Be("regulated");
        resolved.SelectedProfileDisplayName.Should().Be("Regulated Pack");
        resolved.WasAutoSelected.Should().BeTrue();
        resolved.ResolutionReason.Should().Be("Compliance signals present.");
    }
}
