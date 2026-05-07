namespace ArchLucid.Application;
public sealed record SeedFakeResultsResult(bool Success, int ResultCount, string? Error, ApplicationServiceFailureKind? FailureKind = null)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(Error);
    private static byte __ValidatePrimaryConstructorArguments(System.String? error)
    {
        return (byte)0;
    }
}