using ArchiForge.Api.Models;

using FluentValidation;

namespace ArchiForge.Api.Validators;

public sealed class SubmitAgentResultRequestValidator : AbstractValidator<SubmitAgentResultRequest>
{
    public SubmitAgentResultRequestValidator()
    {
        RuleFor(x => x.Result)
            .NotNull().WithMessage("Agent result is required.");
    }
}
