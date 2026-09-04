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
