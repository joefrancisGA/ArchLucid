namespace ArchLucid.Contracts.Validation;

public class SchemaValidationResult
{
    public bool IsValid => Errors.Count == 0;

    public List<string> Errors
    {
        get;
        set;
    } = [];

    public List<SchemaValidationError> DetailedErrors
    {
        get;
        set;
    } = [];
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
