using System.IO.Compression;
using System.Text;

namespace ArchLucid.Api.Tests;

/// <summary>Test-only helper for reading <c>README.txt</c> from reference-evidence ZIP payloads.</summary>
internal static class ReferenceEvidenceZipReadmeReader
{
    internal static string? TryReadReadmeText(byte[] zipBytes)
    {
        if (zipBytes is null || zipBytes.Length == 0)
            return null;

        try
        {
            using MemoryStream ms = new(zipBytes);
            using ZipArchive zip = new(ms, ZipArchiveMode.Read, false);
            ZipArchiveEntry? readme = zip.GetEntry("README.txt");

            if (readme is null)
                return null;

            using Stream stream = readme.Open();
            using StreamReader reader = new(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: false);

            return reader.ReadToEnd();
        }
        catch (InvalidDataException)
        {
            return null;
        }
    }
}
