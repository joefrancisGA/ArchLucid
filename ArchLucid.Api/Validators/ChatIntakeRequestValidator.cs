using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;

using FluentValidation;

namespace ArchLucid.Api.Validators;

public sealed class ChatIntakeRequestValidator : AbstractValidator<ChatIntakeRequest>
{
    public ChatIntakeRequestValidator()
    {
        RuleFor(x => x.RawText)
            .NotEmpty().WithMessage("RawText is required.")
            .MinimumLength(20).WithMessage("RawText must be at least 20 characters.")
            .MaximumLength(DraftIntakeValidation.MaximumFreeTextIntentLength)
            .WithMessage($"RawText must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters.");
    }
}
