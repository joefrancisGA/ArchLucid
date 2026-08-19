using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Evidence;

/// <summary>Thin <see cref="IFormFileCollection" /> wrapper over a file list for batch uploads.</summary>
public sealed class BulkEvidenceUploadFormFileCollection : IFormFileCollection
{
    private readonly IReadOnlyList<IFormFile> _files;

    public BulkEvidenceUploadFormFileCollection(IReadOnlyList<IFormFile> files)
    {
        ArgumentNullException.ThrowIfNull(files);
        _files = files;
    }

    public IFormFile? this[string name] =>
        _files.FirstOrDefault(file => string.Equals(file.Name, name, StringComparison.OrdinalIgnoreCase));

    public IFormFile this[int index] => _files[index];

    public int Count => _files.Count;

    public IEnumerator<IFormFile> GetEnumerator() => _files.GetEnumerator();

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();

    public IFormFile? GetFile(string name) => this[name];

    public IReadOnlyList<IFormFile> GetFiles(string name) =>
        _files.Where(file => string.Equals(file.Name, name, StringComparison.OrdinalIgnoreCase)).ToList();
}
