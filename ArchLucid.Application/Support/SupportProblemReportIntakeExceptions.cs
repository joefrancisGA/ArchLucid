namespace ArchLucid.Application.Support;

public sealed class SupportProblemReportConsentRequiredException : Exception
{
    public SupportProblemReportConsentRequiredException()
        : base("Consent is required before submitting a support problem report.")
    {
    }
}

public sealed class SupportProblemReportScopeMismatchException : Exception
{
    public SupportProblemReportScopeMismatchException(string message)
        : base(message)
    {
    }
}

public sealed class SupportProblemReportValidationException : Exception
{
    public SupportProblemReportValidationException(string message)
        : base(message)
    {
    }
}
