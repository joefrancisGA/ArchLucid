namespace ArchLucid.Application;
public sealed record SubmitResultResult(bool Success, string? ResultId, string? Error, ApplicationServiceFailureKind? FailureKind = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(ResultId, Error);
    private static byte __ValidatePrimaryConstructorArguments(System.String? resultId, System.String? error)
    {
        return (byte)0;
    }
}