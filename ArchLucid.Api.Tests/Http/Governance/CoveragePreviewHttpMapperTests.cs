using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CoveragePreviewHttpMapperTests
{
    [Fact]
    public void Validate_rejects_whitespace_only_description_text()
    {
        GovernanceHttpValidation? validation = CoveragePreviewHttpMapper.Validate(
            new CoveragePreviewRequest
            {
                CloudProvider = CloudProvider.Azure,
                FocusedPilotModeEnabled = true,
                DescriptionText = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("DescriptionText");
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void Validate_rejects_whitespace_only_security_intake_answer()
    {
        GovernanceHttpValidation? validation = CoveragePreviewHttpMapper.Validate(
            new CoveragePreviewRequest
            {
                CloudProvider = CloudProvider.Azure,
                FocusedPilotModeEnabled = true,
                SecurityIntakeAnswer = "\t",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("SecurityIntakeAnswer");
        validation.Message.Should().Contain("whitespace");
    }

    [Fact]
    public void Validate_rejects_overlong_description_text()
    {
        GovernanceHttpValidation? validation = CoveragePreviewHttpMapper.Validate(
            new CoveragePreviewRequest
            {
                CloudProvider = CloudProvider.Azure,
                FocusedPilotModeEnabled = true,
                DescriptionText = new string('x', DraftIntakeValidation.MaximumFreeTextIntentLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("DescriptionText");
        validation.Message.Should().Contain(DraftIntakeValidation.MaximumFreeTextIntentLength.ToString());
    }

    [Fact]
    public void Validate_accepts_null_optional_free_text_fields()
    {
        GovernanceHttpValidation? validation = CoveragePreviewHttpMapper.Validate(
            new CoveragePreviewRequest
            {
                CloudProvider = CloudProvider.Azure,
                FocusedPilotModeEnabled = true,
                DescriptionText = null,
                SecurityIntakeAnswer = null,
            });

        validation.Should().BeNull();
    }
}
