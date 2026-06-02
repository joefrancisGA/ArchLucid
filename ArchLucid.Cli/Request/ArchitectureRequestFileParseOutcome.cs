using ArchLucid.Contracts.Requests;

namespace ArchLucid.Cli.Request;

/// <summary>Result of parsing an on-disk architecture request JSON file.</summary>
internal sealed class ArchitectureRequestFileParseOutcome
{
    public bool IsSuccess
    {
        get;
        init;
    }

    public ArchitectureRequest? Request
    {
        get;
        init;
    }

    public ArchitectureRequestFileParseFailureCode FailureCode
    {
        get;
        init;
    }

    public string? Message
    {
        get;
        init;
    }

    public static ArchitectureRequestFileParseOutcome Ok(ArchitectureRequest request)
    {
        return new ArchitectureRequestFileParseOutcome
        {
            IsSuccess = true,
            Request = request
        };
    }

    public static ArchitectureRequestFileParseOutcome Fail(
        ArchitectureRequestFileParseFailureCode code,
        string message)
    {
        return new ArchitectureRequestFileParseOutcome
        {
            IsSuccess = false,
            FailureCode = code,
            Message = message
        };
    }
}
