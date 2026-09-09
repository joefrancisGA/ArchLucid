using System.IO.Compression;
using System.Text;
using System.Xml;
using System.Xml.Linq;

namespace ArchLucid.ContextIngestion.Diagram;

/// <summary>
///     Expands draw.io <c>mxfile</c> payloads into parseable <c>mxGraphModel</c> XML (AS-009).
/// </summary>
public static class DrawIoXmlPayloadExpander
{
    private static readonly XmlReaderSettings SafeXmlReaderSettings = new()
    {
        DtdProcessing = DtdProcessing.Prohibit,
        XmlResolver = null,
        MaxCharactersInDocument = 4_000_000,
    };

    public static DrawIoXmlPayloadExpandResult Expand(string? drawIoContent)
    {
        List<string> warnings = [];

        if (string.IsNullOrWhiteSpace(drawIoContent))
        {
            warnings.Add("draw.io XML was empty.");

            return new DrawIoXmlPayloadExpandResult
            {
                XmlPayload = string.Empty,
                Warnings = warnings,
            };
        }

        string normalized = drawIoContent.Trim();

        if (normalized.Length > 0 && normalized[0] == '\uFEFF')
        {
            normalized = normalized[1..];
        }

        if (!normalized.Contains("<mxfile", StringComparison.OrdinalIgnoreCase)
            && !normalized.Contains("<mxGraphModel", StringComparison.OrdinalIgnoreCase))
        {
            warnings.Add("draw.io source did not contain mxfile or mxGraphModel markup.");

            return new DrawIoXmlPayloadExpandResult
            {
                XmlPayload = normalized,
                Warnings = warnings,
            };
        }

        if (normalized.Contains("<mxGraphModel", StringComparison.OrdinalIgnoreCase)
            && !normalized.Contains("<mxfile", StringComparison.OrdinalIgnoreCase))
        {
            return new DrawIoXmlPayloadExpandResult
            {
                XmlPayload = normalized,
                Warnings = warnings,
            };
        }

        try
        {
            using XmlReader reader = XmlReader.Create(new StringReader(normalized), SafeXmlReaderSettings);
            XDocument document = XDocument.Load(reader, LoadOptions.None);
            XElement? mxFile = document.Root;

            if (mxFile is null || !string.Equals(mxFile.Name.LocalName, "mxfile", StringComparison.OrdinalIgnoreCase))
            {
                warnings.Add("draw.io mxfile root element was missing.");

                return new DrawIoXmlPayloadExpandResult
                {
                    XmlPayload = normalized,
                    Warnings = warnings,
                };
            }

            List<string> diagramPayloads = [];

            foreach (XElement diagram in mxFile.Elements().Where(element =>
                         string.Equals(element.Name.LocalName, "diagram", StringComparison.OrdinalIgnoreCase)))
            {
                XElement? graphModel = diagram.Elements()
                    .FirstOrDefault(element => string.Equals(element.Name.LocalName, "mxGraphModel", StringComparison.OrdinalIgnoreCase));

                if (graphModel is not null)
                {
                    diagramPayloads.Add(graphModel.ToString(SaveOptions.DisableFormatting));

                    continue;
                }

                string diagramText = diagram.Value.Trim();

                if (diagramText.Length == 0)
                {
                    continue;
                }

                if (TryInflateCompressedDiagram(diagramText, out string? inflated) && inflated is not null)
                {
                    diagramPayloads.Add(inflated);

                    continue;
                }

                warnings.Add(
                    "Compressed draw.io diagram was not extracted; export uncompressed XML from diagrams.net.");
            }

            if (diagramPayloads.Count == 0)
            {
                warnings.Add("No parseable draw.io diagram pages were found in mxfile.");

                return new DrawIoXmlPayloadExpandResult
                {
                    XmlPayload = string.Empty,
                    Warnings = warnings,
                };
            }

            return new DrawIoXmlPayloadExpandResult
            {
                XmlPayload = diagramPayloads[0],
                Warnings = warnings,
            };
        }
        catch (XmlException ex)
        {
            warnings.Add($"draw.io XML parse failed: {ex.Message}");

            return new DrawIoXmlPayloadExpandResult
            {
                XmlPayload = string.Empty,
                Warnings = warnings,
            };
        }
    }

    private static bool TryInflateCompressedDiagram(string encodedPayload, out string? inflatedXml)
    {
        inflatedXml = null;

        try
        {
            byte[] compressedBytes = Convert.FromBase64String(encodedPayload.Trim());
            using MemoryStream input = new(compressedBytes);
            using DeflateStream deflate = new(input, CompressionMode.Decompress);
            using MemoryStream output = new();
            deflate.CopyTo(output);
            string xml = Encoding.UTF8.GetString(output.ToArray()).Trim();

            if (!xml.Contains("<mxGraphModel", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            inflatedXml = xml;

            return true;
        }
        catch (FormatException)
        {
            return false;
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }
}
