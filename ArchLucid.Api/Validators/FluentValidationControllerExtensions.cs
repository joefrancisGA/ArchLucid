using FluentValidation;
using FluentValidation.Results;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Validators;

/// <summary>
///     Applies FluentValidation results to MVC <see cref="ControllerBase.ModelState" /> for explicit controller validation.
/// </summary>
/// <remarks>
///     Auto-validation is registered globally, but mutating policy-pack actions validate explicitly so invalid payloads
///     return <c>400</c> before any SQL or orchestration work (integration tests depend on fast failure).
/// </remarks>
internal static class FluentValidationControllerExtensions
{
    internal static async Task<IActionResult?> ValidateRequestAsync<T>(
        this ControllerBase controller,
        IValidator<T> validator,
        T instance,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(controller);
        ArgumentNullException.ThrowIfNull(validator);
        ArgumentNullException.ThrowIfNull(instance);

        ValidationResult validationResult = await validator.ValidateAsync(instance, cancellationToken);

        if (validationResult.IsValid)
            return null;

        foreach (ValidationFailure failure in validationResult.Errors)
            controller.ModelState.AddModelError(failure.PropertyName, failure.ErrorMessage);

        return controller.ValidationProblem(controller.ModelState);
    }
}
