using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PromotePolicyPackCatalogEntryRequestValidatorTests
{
    private readonly PromotePolicyPackCatalogEntryRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_source_policy_pack_id_is_empty()
    {
        PromotePolicyPackCatalogEntryRequest request = new() { SourcePolicyPackId = Guid.Empty };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "SourcePolicyPackId");
    }

    [Fact]
    public void Validate_fails_when_version_is_provided_but_empty()
    {
        PromotePolicyPackCatalogEntryRequest request = new()
        {
            SourcePolicyPackId = Guid.NewGuid(),
            Version = "",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Version");
    }

    [Fact]
    public void Validate_passes_when_version_is_null()
    {
        PromotePolicyPackCatalogEntryRequest request = new()
        {
            SourcePolicyPackId = Guid.NewGuid(),
            Version = null,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_passes_when_version_is_provided_and_non_empty()
    {
        PromotePolicyPackCatalogEntryRequest request = new()
        {
            SourcePolicyPackId = Guid.NewGuid(),
            Version = "1.0.0",
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
