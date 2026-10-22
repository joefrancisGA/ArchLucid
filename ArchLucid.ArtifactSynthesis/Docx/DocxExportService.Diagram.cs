using ArchLucid.ArtifactSynthesis.Docx.Builders;
using ArchLucid.ArtifactSynthesis.Docx.Helpers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Manifest.Sections;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.ArtifactSynthesis.Docx;

public sealed partial class DocxExportService
{
    private async Task AppendArchitectureDiagramSectionAsync(
        WordprocessingDocument doc,
        Body body,
        ManifestDocument manifest,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        CancellationToken ct)
    {
        WordDocumentBuilder.AddHeading(body, "Architecture diagram");
        byte[]? pngBytes = TryGetPngBytesFromArtifacts(artifacts);

        if (pngBytes is not null)
        {
            ImageHelper.AddPngToBody(doc, body, pngBytes, "Architecture diagram");
            WordDocumentBuilder.AddBodyText(
                body,
                "Raster image embedded from a synthesized artifact on this manifest (PNG supplied as base64 in storage).");
        }
        else if (TryGetMermaidDiagramSource(artifacts) is { } mermaid)
        {
            byte[]? rendered = await diagramImageRenderer.RenderMermaidPngAsync(mermaid, ct);

            if (rendered is not null && rendered.Length > 0)
            {
                ImageHelper.AddPngToBody(doc, body, rendered, "Architecture diagram");
                WordDocumentBuilder.AddBodyText(
                    body,
                    "Raster image rendered from the Mermaid source in the artifact bundle (Mermaid CLI on the API host when enabled).");
            }
            else
            {
                WordDocumentBuilder.AddBodyText(
                    body,
                    "Mermaid source is embedded below. Enable ArchLucid:MermaidCli:Enabled and install the mmdc CLI on the API host to rasterize this diagram automatically, or render architecture.mmd from the bundle externally.");
                WordDocumentBuilder.AddMonospaceSourceLines(body, mermaid);
            }
        }
        else
        {
            WordDocumentBuilder.AddBodyText(
                body,
                "No diagram image or Mermaid source was synthesized for this manifest.");
            AppendManifestTopologySummaryForDiagramFallback(body, manifest);
        }

        WordDocumentBuilder.AddSpacer(body, 2);
    }

    private static byte[]? TryGetPngBytesFromArtifacts(IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        ReadOnlySpan<byte> pngSignature =
        [
            0x89,
            (byte)'P',
            (byte)'N',
            (byte)'G',
            0x0D,
            0x0A,
            0x1A,
            0x0A
        ];

        foreach (SynthesizedArtifact a in artifacts)
        {
            if (string.IsNullOrWhiteSpace(a.Content))
                continue;

            string format = a.Format.Trim();

            if (!format.Equals("png", StringComparison.OrdinalIgnoreCase) &&
                !format.Equals("image/png", StringComparison.OrdinalIgnoreCase))
                continue;

            string trimmed = a.Content.Trim();
            byte[] bytes;

            try
            {
                bytes = Convert.FromBase64String(trimmed);
            }
            catch (FormatException)
            {
                continue;
            }

            if (bytes.Length < pngSignature.Length)
                continue;

            if (!bytes.AsSpan(0, pngSignature.Length).SequenceEqual(pngSignature))
                continue;

            return bytes;
        }

        return null;
    }

    private static string? TryGetMermaidDiagramSource(IReadOnlyList<SynthesizedArtifact> artifacts) =>
        MermaidDiagramArtifactExtractor.TryGetDiagramSource(artifacts, MaxEmbeddedMermaidChars);

    private static void AppendManifestTopologySummaryForDiagramFallback(Body body, ManifestDocument manifest)
    {
        int resourceCount = manifest.Topology.Resources.Count;
        int patternCount = manifest.Topology.SelectedPatterns.Count;
        int decisionCount = manifest.Decisions.Count;

        WordDocumentBuilder.AddBodyText(
            body,
            $"Committed manifest includes {resourceCount} topology resource(s), {patternCount} selected pattern(s), and {decisionCount} decision(s). See Topology Posture and Decisions below for full detail.");
    }
}
