using ArchLucid.Contracts.Requests;

using FluentValidation;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Application.Planning;

/// <summary>
///     Registers a graph-complete <see cref="IValidator{ArchitectureRequest}" /> so composition
///     <c>ValidateOnBuild</c> can activate <see cref="ArchitectureRequestIntakeFacade" />.
/// </summary>
public static class ArchitectureRequestIntakeValidatorRegistration
{
    public static void Register(IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.TryAddScoped<IValidator<ArchitectureRequest>, ArchitectureRequestIntakeGraphValidator>();
    }
}
