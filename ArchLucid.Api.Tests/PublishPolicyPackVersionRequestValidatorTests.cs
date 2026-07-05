using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PublishPolicyPackVersionRequestValidatorTests
{
    private readonly PublishPolicyPackVersionRequestValidator _validator = new();

    [Fact]
    public void Valid_request_passes()
    {
        PublishPolicyPackVersionRequest request = new()
        {
            Version = "1.2.3",
            ContentJson = "{\"complianceRuleIds\":[]}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Invalid_version_fails()
    {
        PublishPolicyPackVersionRequest request = new()
        {
            Version = "latest",
            ContentJson = "{}",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Invalid_content_json_fails()
    {
        PublishPolicyPackVersionRequest request = new()
        {
            Version = "1.0.0",
            ContentJson = "[]]",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }
}
