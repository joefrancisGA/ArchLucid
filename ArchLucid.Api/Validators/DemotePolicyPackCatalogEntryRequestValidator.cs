using ArchLucid.Api.Controllers.Governance;

using FluentValidation;

namespace ArchLucid.Api.Validators;

/// <summary>FluentValidation for <see cref="DemotePolicyPackCatalogEntryRequest"/>.</summary>
public sealed class DemotePolicyPackCatalogEntryRequestValidator : AbstractValidator<DemotePolicyPackCatalogEntryRequest>
{
    public DemotePolicyPackCatalogEntryRequestValidator()
    {
        RuleFor(x => x.PolicyPackCatalogEntryId).NotEmpty();
    }
}
