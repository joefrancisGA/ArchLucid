using ArchLucid.Application.Identity;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RegistrationRequestBaselineValidatorTests
{
    [Fact]
    public void Validate_requires_hours_when_source_is_provided()
    {
        RegistrationBaselineValidation result = RegistrationRequestBaselineValidator.Validate(
            new TenantSelfRegistrationRequest
            {
                OrganizationName = "Org",
                AdminEmail = "a@b.com",
                BaselineReviewCycleSource = "team estimate"
            });

        result.IsValid.Should().BeFalse();
        result.Code.Should().Be("baseline_incomplete");
    }

    [Fact]
    public void Validate_rejects_hours_out_of_range()
    {
        RegistrationBaselineValidation result = RegistrationRequestBaselineValidator.Validate(
            new TenantSelfRegistrationRequest
            {
                OrganizationName = "Org",
                AdminEmail = "a@b.com",
                BaselineReviewCycleHours = 0m
            });

        result.IsValid.Should().BeFalse();
        result.Code.Should().Be("baseline_out_of_range");
    }

    [Fact]
    public void Validate_rejects_unknown_company_size()
    {
        RegistrationBaselineValidation result = RegistrationRequestBaselineValidator.Validate(
            new TenantSelfRegistrationRequest
            {
                OrganizationName = "Org",
                AdminEmail = "a@b.com",
                CompanySize = "nope"
            });

        result.IsValid.Should().BeFalse();
        result.Code.Should().Be("company_size_invalid");
    }

    [Fact]
    public void Validate_rejects_non_positive_architecture_team_size()
    {
        RegistrationBaselineValidation result = RegistrationRequestBaselineValidator.Validate(
            new TenantSelfRegistrationRequest
            {
                OrganizationName = "Org",
                AdminEmail = "a@b.com",
                ArchitectureTeamSize = 0
            });

        result.IsValid.Should().BeFalse();
        result.Code.Should().Be("architecture_team_size_out_of_range");
    }

    [Fact]
    public void Validate_requires_other_text_when_industry_is_other()
    {
        RegistrationBaselineValidation result = RegistrationRequestBaselineValidator.Validate(
            new TenantSelfRegistrationRequest
            {
                OrganizationName = "Org",
                AdminEmail = "a@b.com",
                IndustryVertical = "Other"
            });

        result.IsValid.Should().BeFalse();
        result.Code.Should().Be("industry_other_required");
    }

    [Fact]
    public void NormalizeBaselineReviewCycleSource_strips_control_chars_and_truncates()
    {
        string raw = "  team\u0001 estimate " + new string('x', 300);
        string? normalized = RegistrationRequestBaselineValidator.NormalizeBaselineReviewCycleSource(raw);

        normalized.Should().NotBeNull();
        normalized!.Should().NotContain("\u0001");
        normalized.Length.Should().Be(256);
        normalized.Should().StartWith("team estimate");
    }

    [Fact]
    public void Validate_accepts_optional_structured_baseline()
    {
        RegistrationBaselineValidation result = RegistrationRequestBaselineValidator.Validate(
            new TenantSelfRegistrationRequest
            {
                OrganizationName = "Org",
                AdminEmail = "a@b.com",
                BaselineReviewCycleHours = 18m,
                BaselineReviewCycleSource = "team estimate",
                CompanySize = RegistrationRequestBaselineValidator.AllowedCompanySizes[2],
                ArchitectureTeamSize = 4,
                IndustryVertical = "Technology"
            });

        result.IsValid.Should().BeTrue();
        result.NormalizedSource.Should().Be("team estimate");
    }
}
