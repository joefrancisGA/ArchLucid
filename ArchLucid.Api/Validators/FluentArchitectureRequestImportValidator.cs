using ArchLucid.Application.Import;
using ArchLucid.Contracts.Requests;

using FluentValidation;

namespace ArchLucid.Api.Validators;

public sealed class FluentArchitectureRequestImportValidator(IValidator<ArchitectureRequest> validator)
    : IArchitectureRequestImportValidator
{
    private readonly IValidator<ArchitectureRequest> _validator =
        validator ?? throw new ArgumentNullException(nameof(validator));

    public async Task<ArchitectureRequestImportValidationResult> ValidateAsync(ArchitectureRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        FluentValidation.Results.ValidationResult result = await _validator.ValidateAsync(request, ct);

        if (result.IsValid)
            return new ArchitectureRequestImportValidationResult { IsValid = true };

        List<string> errors = result.Errors.ConvertAll(static e => e.ErrorMessage);

        return new ArchitectureRequestImportValidationResult { IsValid = false, Errors = errors };
    }
}
