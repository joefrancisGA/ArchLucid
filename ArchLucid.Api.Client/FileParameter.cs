namespace ArchLucid.Api.Client.Generated;

/// <summary>
///     Multipart file payload referenced by NSwag-generated <see cref="ArchLucidApiClient" /> upload operations (for example
///     architecture request import). NSwag emits calls using this shape when OpenAPI declares <c>multipart/form-data</c> file parts,
///     but does not always emit this helper type into <c>Generated/ArchLucidApiClient.g.cs</c>.
/// </summary>
public sealed class FileParameter
{
    public FileParameter(Stream data)
        : this(data, null, null)
    {
    }

    public FileParameter(Stream data, string? fileName)
        : this(data, fileName, null)
    {
    }

    public FileParameter(Stream data, string? fileName, string? contentType)
    {
        Data = data ?? throw new ArgumentNullException(nameof(data));
        FileName = fileName;
        ContentType = contentType;
    }

    public Stream Data { get; }

    public string? FileName { get; }

    public string? ContentType { get; }
}
