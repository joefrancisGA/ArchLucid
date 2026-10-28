using ArchLucid.Api.Models;

using FluentValidation;

namespace ArchLucid.Api.Validators;

/// <summary>
///     FluentValidation for <see cref="PolicyPackSimulateRequest" /> (<c>POST /v1/policy-packs/simulate</c>).
/// </summary>
public sealed class PolicyPackSimulateRequestValidator : AbstractValidator<PolicyPackSimulateRequest>
{
    /// <summary>Registers run id, content presence, and gate ordinal bounds.</summary>
    public PolicyPackSimulateRequestValidator()
    {
        RuleFor(x => x.RunId)
            .NotEmpty()
            .WithMessage("runId is required.");

        RuleFor(x => x.Content)
            .NotNull()
            .WithMessage("content is required.");

        RuleFor(x => x.BlockCommitMinimumSeverity)
            .InclusiveBetween(0, 3)
            .When(x => x.BlockCommitMinimumSeverity.HasValue)
            .WithMessage("blockCommitMinimumSeverity must be between 0 (Info) and 3 (Critical).");

        RuleFor(x => x.ProposedPolicyPackId)
<<<<<<< HEAD
            .Must(id => !id.HasValue || id.Value != Guid.Empty)
=======
            .Must(id => id is null || id != Guid.Empty)
>>>>>>> origin/bugsmash-2
            .WithMessage("proposedPolicyPackId must not be the empty guid when provided.");
    }
}
