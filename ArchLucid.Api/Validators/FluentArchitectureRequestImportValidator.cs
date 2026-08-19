using ArchLucid.Application.Import;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Security;

using FluentValidation;
using FluentValidation.Results;

namespace ArchLucid.Api.Validators;

public sealed class FluentArchitectureRequestImportValidator(IValidator<ArchitectureRequest> validator)
    : IArchitectureRequestImportValidator
{
    private readonly IValidator<ArchitectureRequest> _validator =
        validator ?? throw new ArgumentNullException(nameof(validator));

    public async Task<ArchitectureRequestImportValidationResult> ValidateAsync(ArchitectureRequest request,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        ValidationResult result = await _validator.ValidateAsync(request, ct);

        if (!result.IsValid)
        {
            List<string> errors = result.Errors.ConvertAll(static e => e.ErrorMessage);

            return new ArchitectureRequestImportValidationResult { IsValid = false, Errors = errors };
        }

        string? documentUrlRejection = await AllowedDocumentUrlPolicy
            .TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync(request.Documents, ct)
            .ConfigureAwait(false);

        if (documentUrlRejection is not null)
            return new ArchitectureRequestImportValidationResult
            {
                IsValid = false,
                Errors = [documentUrlRejection]
            };

        return new ArchitectureRequestImportValidationResult { IsValid = true };
    }
}
