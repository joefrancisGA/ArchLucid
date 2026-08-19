using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Pilots;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI file IO wrapper around ProductDocumentationPdfBuilder.")]
internal static class DocsPdfRenderCommand
{
    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (!TryParseArgs(args, out string? markdownPath, out string? metadataPath, out string? outputPath, out string? error))
        {
            Console.Error.WriteLine(error);
            Console.Error.WriteLine(
                "Usage: archlucid docs pdf render --markdown <path.md> --metadata <metadata.json> --out <path.pdf>");

            return Task.FromResult(CliExitCode.UsageError);
        }

        cancellationToken.ThrowIfCancellationRequested();

        string markdown = File.ReadAllText(markdownPath!, Encoding.UTF8);
        string metadataJson = File.ReadAllText(metadataPath!, Encoding.UTF8);
        ProductDocumentationPdfRenderMetadata? metadata =
            JsonSerializer.Deserialize<ProductDocumentationPdfRenderMetadata>(metadataJson, JsonRead);

        if (metadata is null || string.IsNullOrWhiteSpace(metadata.Title))
        {
            Console.Error.WriteLine("Metadata JSON must include a non-empty title.");

            return Task.FromResult(CliExitCode.UsageError);
        }

        ProductDocumentationPdfBuilder builder = new();
        byte[]? logoBytes = TryLoadLogoBytes(metadata.LogoPath);
        byte[] pdf = builder.Build(markdown, metadata, logoBytes);

        string? outputDirectory = Path.GetDirectoryName(outputPath);

        if (!string.IsNullOrWhiteSpace(outputDirectory))
            Directory.CreateDirectory(outputDirectory);

        File.WriteAllBytes(outputPath!, pdf);

        if (CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(JsonSerializer.Serialize(new { ok = true, outputPath, bytes = pdf.Length }));
        }
        else
        {
            Console.WriteLine($"Wrote {outputPath} ({pdf.Length} bytes).");
        }

        return Task.FromResult(CliExitCode.Success);
    }

    private static bool TryParseArgs(
        string[] args,
        out string? markdownPath,
        out string? metadataPath,
        out string? outputPath,
        out string error)
    {
        markdownPath = null;
        metadataPath = null;
        outputPath = null;
        error = string.Empty;

        for (int i = 0; i < args.Length; i++)
        {
            string arg = args[i];

            if (string.Equals(arg, "--markdown", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadNext(args, ref i, out markdownPath))
                {
                    error = "Missing value for --markdown.";

                    return false;
                }

                continue;
            }

            if (string.Equals(arg, "--metadata", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadNext(args, ref i, out metadataPath))
                {
                    error = "Missing value for --metadata.";

                    return false;
                }

                continue;
            }

            if (string.Equals(arg, "--out", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadNext(args, ref i, out outputPath))
                {
                    error = "Missing value for --out.";

                    return false;
                }

                continue;
            }

            error = $"Unknown argument: {arg}";

            return false;
        }

        if (string.IsNullOrWhiteSpace(markdownPath))
        {
            error = "--markdown is required.";

            return false;
        }

        if (string.IsNullOrWhiteSpace(metadataPath))
        {
            error = "--metadata is required.";

            return false;
        }

        if (string.IsNullOrWhiteSpace(outputPath))
        {
            error = "--out is required.";

            return false;
        }

        if (!File.Exists(markdownPath))
        {
            error = $"Markdown file not found: {markdownPath}";

            return false;
        }

        if (!File.Exists(metadataPath))
        {
            error = $"Metadata file not found: {metadataPath}";

            return false;
        }

        return true;
    }

    private static byte[]? TryLoadLogoBytes(string? logoPath)
    {
        if (string.IsNullOrWhiteSpace(logoPath))
            return null;

        string resolved = Path.GetFullPath(logoPath.Trim());

        if (!File.Exists(resolved))
            return null;

        return File.ReadAllBytes(resolved);
    }

    private static bool TryReadNext(string[] args, ref int index, out string? value)
    {
        if (index + 1 >= args.Length)
        {
            value = null;

            return false;
        }

        index++;
        value = args[index];

        return !string.IsNullOrWhiteSpace(value);
    }
}
