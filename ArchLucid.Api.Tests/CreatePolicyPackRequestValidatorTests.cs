using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CreatePolicyPackRequestValidatorTests
{
    private readonly CreatePolicyPackRequestValidator _validator = new();

    [Fact]
    public void Validate_passes_when_name_padding_makes_raw_length_exceed_300_but_trimmed_name_is_valid()
    {
        string paddedName = new string(' ', 298) + "Pack";
        paddedName.Length.Should().BeGreaterThan(PolicyPackRequestValidationRules.PackNameMaxLength);

        CreatePolicyPackRequest request = new()
        {
            Name = paddedName,
            PackType = PolicyPackType.TenantCustom,
            InitialContentJson = "{}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_fails_when_name_is_whitespace_only()
    {
        CreatePolicyPackRequest request = new()
        {
            Name = "   ",
            PackType = PolicyPackType.TenantCustom,
            InitialContentJson = "{}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreatePolicyPackRequest.Name));
    }

    [Fact]
    public void Valid_request_passes()
    {
        CreatePolicyPackRequest request = new()
        {
            Name = "Security baseline",
            PackType = PolicyPackType.TenantCustom,
            InitialContentJson = "{}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Invalid_pack_type_fails()
    {
        CreatePolicyPackRequest request = new()
        {
            Name = "Pack",
            PackType = "UnknownCustom",
            InitialContentJson = "{}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Invalid_pack_type_built_in_fails()
    {
        CreatePolicyPackRequest request = new()
        {
            Name = "Pack",
            PackType = PolicyPackType.BuiltIn,
            InitialContentJson = "{}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Empty_initial_content_json_fails()
    {
        CreatePolicyPackRequest request = new()
        {
            Name = "Pack",
            PackType = PolicyPackType.TenantCustom,
            InitialContentJson = "",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("InitialContentJson is required"));
    }

    [Fact]
    public void Whitespace_only_description_fails()
    {
        CreatePolicyPackRequest request = new()
        {
            Name = "Pack",
            Description = "   ",
            PackType = PolicyPackType.TenantCustom,
            InitialContentJson = "{}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreatePolicyPackRequest.Description));
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("whitespace"));
    }

    [Fact]
    public void Empty_description_passes()
    {
        CreatePolicyPackRequest request = new()
        {
            Name = "Pack",
            Description = string.Empty,
            PackType = PolicyPackType.TenantCustom,
            InitialContentJson = "{}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Invalid_initial_json_fails()
    {
        CreatePolicyPackRequest request = new()
        {
            Name = "Pack",
            PackType = PolicyPackType.TenantCustom,
            InitialContentJson = "{bad",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }
}
