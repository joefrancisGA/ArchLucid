using ArchLucid.Contracts.Requests;

using FluentValidation;

namespace ArchLucid.Application.Planning;

/// <summary>
///     Satisfies DI for <see cref="ArchitectureRequestIntakeFacade" /> in hosts that do not load
///     <c>ArchLucid.Api</c> FluentValidation assembly scan. The API registers
///     <c>ArchitectureRequestValidator</c> afterward so request creation still uses the full rule set.
/// </summary>
public sealed class ArchitectureRequestIntakeGraphValidator : AbstractValidator<ArchitectureRequest>
{
}
