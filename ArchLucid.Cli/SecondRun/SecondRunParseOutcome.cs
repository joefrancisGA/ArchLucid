using ArchLucid.Contracts.Requests;

namespace ArchLucid.Cli.SecondRun;

/// <summary>Result of parsing a <c>SECOND_RUN.toml</c> / <c>.json</c> file into an <see cref="ArchitectureRequest" />.</summary>
public sealed class SecondRunParseOutcome
{
    public bool IsSuccess
    {
        get;
        private init;
    }

    public ArchitectureRequest? Request
    {
        get;
        private init;
    }

    public SecondRunParseFailureCode FailureCode
    {
        get;
        private init;
    }

    public string? Message
    {
        get;
        private init;
    }

    public static SecondRunParseOutcome Ok(ArchitectureRequest request)
    {
        return new SecondRunParseOutcome
        {
            IsSuccess = true, Request = request, FailureCode = SecondRunParseFailureCode.None, Message = null
        };
    }

    public static SecondRunParseOutcome Fail(SecondRunParseFailureCode code, string message)
    {
        return new SecondRunParseOutcome { IsSuccess = false, Request = null, FailureCode = code, Message = message };
    }
}
