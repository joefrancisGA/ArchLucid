namespace ArchLucid.Core.OperationalErrors;

/// <summary>Classification for triage in the internal operational error inbox.</summary>
public static class OperationalErrorCategory
{
    public const string HttpError = "HttpError";

    public const string DatabaseError = "DatabaseError";

    public const string UnhandledException = "UnhandledException";
}
