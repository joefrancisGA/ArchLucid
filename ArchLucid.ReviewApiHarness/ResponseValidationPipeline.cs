using System.Text.Json;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Combines OpenAPI schema, property completeness, and DTO deserialization validation.</summary>
public sealed class ResponseValidationPipeline
{
    private readonly OpenApiSchemaValidator _schemaValidator;
    private readonly OpenApiPropertyCompletenessValidator _completenessValidator;
    private readonly DtoDeserializationValidator _dtoValidator;

    public ResponseValidationPipeline(OpenApiContractCatalog catalog)
    {
        ArgumentNullException.ThrowIfNull(catalog);
        _schemaValidator = new OpenApiSchemaValidator(catalog);
        _completenessValidator = new OpenApiPropertyCompletenessValidator(catalog);
        _dtoValidator = new DtoDeserializationValidator();
    }

    public ResponseValidationResult ValidateJson(string schemaName, Type dtoType, JsonElement payload)
    {
        ResponseValidationResult schema = _schemaValidator.Validate(schemaName, payload);
        ResponseValidationResult completeness = _completenessValidator.Validate(schemaName, payload);
        ResponseValidationResult dto = _dtoValidator.Validate(dtoType, payload);
        return ResponseValidationResult.Combine(schema, completeness, dto);
    }
}
