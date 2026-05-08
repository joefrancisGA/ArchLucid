namespace ArchLucid.Application.Jobs;

public sealed record BackgroundJobFile
{
    public string FileName
    {
        get;
        init;
    }

    public string ContentType
    {
        get;
        init;
    }

    public byte[] Bytes
    {
        get;
        init;
    }

    public BackgroundJobFile(string fileName, string contentType, byte[] bytes)
    {
        FileName = fileName ?? throw new ArgumentNullException(nameof(fileName));
        ContentType = contentType ?? throw new ArgumentNullException(nameof(contentType));
        Bytes = bytes ?? throw new ArgumentNullException(nameof(bytes));
    }
}
