using System.IO.Compression;
using System.Xml;
using System.Xml.Linq;

namespace ArchLucid.ContextIngestion.Diagram;

/// <summary>
///     Reads Visio page XML from a <c>.vsdx</c> Open Packaging zip (AS-010).
/// </summary>
internal static class VsdxPackageReader
{
    private static readonly XmlReaderSettings SafeXmlReaderSettings = new()
    {
        DtdProcessing = DtdProcessing.Prohibit,
        XmlResolver = null,
        MaxCharactersInDocument = 4_000_000,
    };

    internal static VsdxPackageReadResult Read(byte[] packageBytes)
    {
        ArgumentNullException.ThrowIfNull(packageBytes);

        List<string> warnings = [];
        List<string> pageXmlDocuments = [];

        if (packageBytes.Length == 0)
        {
            warnings.Add("Visio package was empty.");

            return new VsdxPackageReadResult
            {
                PageXmlDocuments = pageXmlDocuments,
                Warnings = warnings,
            };
        }

        try
        {
            using MemoryStream stream = new(packageBytes);
            using ZipArchive archive = new(stream, ZipArchiveMode.Read, leaveOpen: false);

            foreach (ZipArchiveEntry entry in archive.Entries)
            {
                if (!VsdxZipEntryPathGuard.IsSafeEntryPath(entry.FullName))
                {
                    warnings.Add($"Rejected unsafe Visio zip entry '{entry.FullName}'.");

                    continue;
                }

                if (!IsVisioPageEntry(entry.FullName))
                {
                    continue;
                }

                using Stream entryStream = entry.Open();
                using StreamReader reader = new(entryStream);
                string pageXml = reader.ReadToEnd();

                if (!string.IsNullOrWhiteSpace(pageXml))
                {
                    pageXmlDocuments.Add(pageXml);
                }
            }
        }
        catch (InvalidDataException ex)
        {
            warnings.Add($"Visio package zip read failed: {ex.Message}");

            return new VsdxPackageReadResult
            {
                PageXmlDocuments = pageXmlDocuments,
                Warnings = warnings,
            };
        }

        if (pageXmlDocuments.Count == 0)
        {
            warnings.Add("No Visio page XML documents were found in the package.");
        }

        return new VsdxPackageReadResult
        {
            PageXmlDocuments = pageXmlDocuments,
            Warnings = warnings,
        };
    }

    internal static bool TryDecodePackageContent(string? content, out byte[] packageBytes, List<string> warnings)
    {
        packageBytes = [];

        if (string.IsNullOrWhiteSpace(content))
        {
            warnings.Add("Visio package content was empty.");

            return false;
        }

        string normalized = content.Trim();

        if (normalized.Length > 0 && normalized[0] == '\uFEFF')
        {
            normalized = normalized[1..];
        }

        try
        {
            packageBytes = Convert.FromBase64String(normalized);

            return packageBytes.Length > 0;
        }
        catch (FormatException)
        {
            warnings.Add("Visio package content was not valid base64.");

            return false;
        }
    }

    private static bool IsVisioPageEntry(string entryPath)
    {
        string normalized = entryPath.Replace('\\', '/').Trim();

        if (!normalized.StartsWith("visio/pages/page", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return normalized.EndsWith(".xml", StringComparison.OrdinalIgnoreCase);
    }

    internal static XDocument ParsePageXml(string pageXml)
    {
        using XmlReader reader = XmlReader.Create(new StringReader(pageXml), SafeXmlReaderSettings);

        return XDocument.Load(reader, LoadOptions.None);
    }
}
