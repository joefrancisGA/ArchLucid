namespace ArchLucid.Application.Value;
public sealed record ValueReportJobPollResult(bool Found, bool Completed, byte[]? DocxBytes, string? FileName, string? ErrorMessage)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(DocxBytes, FileName, ErrorMessage);
    private static byte __ValidatePrimaryConstructorArguments(System.Byte[]? docxBytes, System.String? fileName, System.String? errorMessage)
    {
        return (byte)0;
    }
}