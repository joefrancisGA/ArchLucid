using ArchLucid.Api.Controllers.Governance;

using FluentValidation;

namespace ArchLucid.Api.Validators;

/// <summary>FluentValidation for <see cref="PromotePolicyPackCatalogEntryRequest"/>.</summary>
public sealed class PromotePolicyPackCatalogEntryRequestValidator : AbstractValidator<PromotePolicyPackCatalogEntryRequest>
{
    public PromotePolicyPackCatalogEntryRequestValidator()
    {
        RuleFor(x => x.SourcePolicyPackId).NotEmpty();

        When(
            x => x.Version is not null,
            () => RuleFor(x => x.Version!).NotEmpty());
    }
}
