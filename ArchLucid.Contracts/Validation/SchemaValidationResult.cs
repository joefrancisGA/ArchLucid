using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Validation;

public class SchemaValidationResult
{
    public bool IsValid => Errors.Count == 0;

    private List<string> errors = [];

    public List<string> Errors
    {
        get => errors;
        set => errors = ContractCollectionDefaults.Coalesce(value);
    }

    private List<SchemaValidationError> detailedErrors = [];

    public List<SchemaValidationError> DetailedErrors
    {
        get => detailedErrors;
        set => detailedErrors = ContractCollectionDefaults.Coalesce(value);
    }
}

public class SchemaValidationError
{
    public required string Message
    {
        get;
        init;
    }

    public required string Location
    {
        get;
        init;
    }

    public string? SchemaPath
    {
        get;
        init;
    }

    public string? Keyword
    {
        get;
        init;
    }
}
