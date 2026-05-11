namespace ArchLucid.Application.Jobs;

public sealed record BackgroundJobFile(string FileName, string ContentType, byte[] Bytes)
{
    public string FileName
    {
        get;
        init;
    } = FileName ?? throw new ArgumentNullException(nameof(FileName));

    public string ContentType
    {
        get;
        init;
    } = ContentType ?? throw new ArgumentNullException(nameof(ContentType));

    public byte[] Bytes
    {
        get;
        init;
    } = Bytes ?? throw new ArgumentNullException(nameof(Bytes));
}
