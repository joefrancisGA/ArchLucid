using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AssignPolicyPackRequestValidatorTests
{
    private readonly AssignPolicyPackRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_version_is_empty()
    {
        AssignPolicyPackRequest request = new() { Version = "", ScopeLevel = "Tenant", IsPinned = false };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Version is required"));
    }

    [Fact]
    public void Validate_fails_when_version_is_not_semver()
    {
        AssignPolicyPackRequest request = new() { Version = "not-a-version", ScopeLevel = "Tenant", IsPinned = false };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("SemVer"));
    }

    [Theory]
    [InlineData("1.0.0")]
    [InlineData("2.1.0-rc.1")]
    [InlineData("v1.2.3")]
    public void Validate_passes_for_semver_versions(string version)
    {
        AssignPolicyPackRequest request = new() { Version = version, ScopeLevel = "Tenant", IsPinned = false };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_fails_when_scope_level_is_whitespace_only()
    {
        AssignPolicyPackRequest request = new() { Version = "1.0.0", ScopeLevel = "   ", IsPinned = false };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(AssignPolicyPackRequest.ScopeLevel));
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("whitespace"));
    }

    [Fact]
    public void Validate_fails_when_scope_level_is_unrecognized()
    {
        AssignPolicyPackRequest request = new() { Version = "1.0.0", ScopeLevel = "Galaxy", IsPinned = false };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("ScopeLevel must be one of"));
    }

    [Theory]
    [InlineData("Tenant")]
    [InlineData("workspace")]
    [InlineData("PROJECT")]
    public void Validate_passes_for_known_scope_levels_regardless_of_case(string scopeLevel)
    {
        AssignPolicyPackRequest request = new() { Version = "1.0.0", ScopeLevel = scopeLevel, IsPinned = false };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
