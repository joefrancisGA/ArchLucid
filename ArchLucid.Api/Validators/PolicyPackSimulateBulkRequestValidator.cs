using ArchLucid.Api.Models;

using FluentValidation;

namespace ArchLucid.Api.Validators;

/// <summary>
///     FluentValidation for <see cref="PolicyPackSimulateBulkRequest" /> (
///     <c>POST /v1/policy-packs/{id}/simulate-bulk</c>).
/// </summary>
public sealed class PolicyPackSimulateBulkRequestValidator : AbstractValidator<PolicyPackSimulateBulkRequest>
{
    /// <summary>Registers gate ordinal bounds (single-simulate parity).</summary>
    public PolicyPackSimulateBulkRequestValidator()
    {
        RuleFor(x => x.BlockCommitMinimumSeverity)
            .InclusiveBetween(0, 3)
            .When(x => x.BlockCommitMinimumSeverity.HasValue)
            .WithMessage("blockCommitMinimumSeverity must be between 0 (Info) and 3 (Critical).");
    }
}
