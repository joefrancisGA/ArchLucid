namespace ArchLucid.Application.Jobs;
public sealed record BackgroundJobFile(string FileName, string ContentType, byte[] Bytes)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(FileName, ContentType, Bytes);
    private static byte __ValidatePrimaryConstructorArguments(System.String fileName, System.String contentType, System.Byte[] bytes)
    {
        ArgumentNullException.ThrowIfNull(fileName);
        ArgumentNullException.ThrowIfNull(contentType);
        ArgumentNullException.ThrowIfNull(bytes);
        return (byte)0;
    }
}