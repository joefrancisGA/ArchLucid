using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DemotePolicyPackCatalogEntryRequestValidatorTests
{
    private readonly DemotePolicyPackCatalogEntryRequestValidator _validator = new();

    [Fact]
    public void Validate_fails_when_policy_pack_catalog_entry_id_is_empty()
    {
        DemotePolicyPackCatalogEntryRequest request = new() { PolicyPackCatalogEntryId = Guid.Empty };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "PolicyPackCatalogEntryId");
    }

    [Fact]
    public void Validate_passes_when_policy_pack_catalog_entry_id_is_set()
    {
        DemotePolicyPackCatalogEntryRequest request = new() { PolicyPackCatalogEntryId = Guid.NewGuid() };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
