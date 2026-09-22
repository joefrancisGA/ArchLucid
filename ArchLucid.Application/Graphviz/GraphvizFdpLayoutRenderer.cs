using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Graphviz;

[ExcludeFromCodeCoverage(Justification = "Requires external Graphviz fdp binary; integration-tested when available.")]
public sealed class GraphvizFdpLayoutRenderer(
    IOptionsMonitor<GraphvizOptions> options,
    ILogger<GraphvizFdpLayoutRenderer> logger) : IGraphvizLayoutRenderer
{
    private static readonly TimeSpan ProcessTimeout = TimeSpan.FromSeconds(10);

    private readonly IOptionsMonitor<GraphvizOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<GraphvizFdpLayoutRenderer> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public Task<GraphvizLayoutRenderResult> RenderSvgAsync(string dot, CancellationToken cancellationToken = default)
    {
        return RenderAsync(dot, cancellationToken);
    }

    public async Task<GraphvizLayoutRenderResult> RenderPngAsync(string dot, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dot);

        if (string.IsNullOrWhiteSpace(dot))
        {
            return Failed("DOT source was empty.");
        }

        GraphvizOptions settings = _options.CurrentValue;

        if (!settings.Enabled)
        {
            return Failed("Graphviz layout is disabled.");
        }

        string? binaryPath = ResolveBinaryPath(settings.FdpPath);

        if (binaryPath is null)
        {
            return Failed("Graphviz fdp binary was not found.");
        }

        using CancellationTokenSource timeoutCts = new(ProcessTimeout);
        using CancellationTokenSource linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeoutCts.Token);

        try
        {
            return await RenderPngViaTempFileAsync(binaryPath, dot, linkedCts.Token);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(ex, "Graphviz fdp PNG render failed.");
            }

            return Failed("Graphviz fdp PNG render failed.");
        }
    }

    private async Task<GraphvizLayoutRenderResult> RenderAsync(
        string dot,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(dot);

        if (string.IsNullOrWhiteSpace(dot))
        {
            return Failed("DOT source was empty.");
        }

        GraphvizOptions settings = _options.CurrentValue;

        if (!settings.Enabled)
        {
            return Failed("Graphviz layout is disabled.");
        }

        string? binaryPath = ResolveBinaryPath(settings.FdpPath);

        if (binaryPath is null)
        {
            return Failed("Graphviz fdp binary was not found.");
        }

        try
        {
            ProcessStartInfo startInfo = new()
            {
                FileName = binaryPath,
                Arguments = "-Tsvg",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using CancellationTokenSource timeoutCts = new(ProcessTimeout);
            using CancellationTokenSource linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
                cancellationToken,
                timeoutCts.Token);

            using Process process = new();
            process.StartInfo = startInfo;
            process.Start();

            await process.StandardInput.WriteAsync(dot.AsMemory(), linkedCts.Token);
            process.StandardInput.Close();

            string stdout = await process.StandardOutput.ReadToEndAsync(linkedCts.Token);
            string stderr = await process.StandardError.ReadToEndAsync(linkedCts.Token);
            await process.WaitForExitAsync(linkedCts.Token);

            if (process.ExitCode != 0)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        "Graphviz fdp exited with code {ExitCode}. DOT length {DotLength}. STDERR length {StdErrLength}",
                        process.ExitCode,
                        dot.Length,
                        stderr.Length);
                }

                return Failed($"Graphviz fdp exited with code {process.ExitCode}.");
            }

            return SanitizeSvg(stdout);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(ex, "Graphviz fdp layout render failed.");
            }

            return Failed("Graphviz fdp layout render failed.");
        }
    }

    private async Task<GraphvizLayoutRenderResult> RenderPngViaTempFileAsync(
        string binaryPath,
        string dot,
        CancellationToken cancellationToken)
    {
        string tempDir = Path.Combine(Path.GetTempPath(), "archlucid-graphviz", Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(tempDir);
            string inputPath = Path.Combine(tempDir, "diagram.dot");
            string outputPath = Path.Combine(tempDir, "diagram.png");
            await File.WriteAllTextAsync(inputPath, dot, cancellationToken);

            ProcessStartInfo startInfo = new()
            {
                FileName = binaryPath,
                Arguments = $"-Tpng -o \"{outputPath}\" \"{inputPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using Process process = new();
            process.StartInfo = startInfo;
            process.Start();
            string stderr = await process.StandardError.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        "Graphviz fdp PNG exited with code {ExitCode}. DOT length {DotLength}. STDERR length {StdErrLength}",
                        process.ExitCode,
                        dot.Length,
                        stderr.Length);
                }

                return Failed($"Graphviz fdp PNG exited with code {process.ExitCode}.");
            }

            if (!File.Exists(outputPath))
            {
                return Failed("Graphviz fdp PNG output file was missing.");
            }

            byte[] png = await File.ReadAllBytesAsync(outputPath, cancellationToken);

            if (png.Length == 0)
            {
                return Failed("Graphviz fdp returned empty PNG output.");
            }

            return new GraphvizLayoutRenderResult
            {
                Succeeded = true,
                Png = png,
            };
        }
        finally
        {
            try
            {
                if (Directory.Exists(tempDir))
                {
                    Directory.Delete(tempDir, true);
                }
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Failed to delete temporary Graphviz work directory '{TempDir}'.",
                        LogSanitizer.Sanitize(tempDir));
                }
            }
        }
    }

    private GraphvizLayoutRenderResult SanitizeSvg(string svg)
    {
        SvgDiagramSanitizeResult sanitized = SvgDiagramSanitizer.Sanitize(svg);

        if (string.IsNullOrWhiteSpace(sanitized.SanitizedContent))
        {
            return Failed("Graphviz SVG failed sanitization.");
        }

        return new GraphvizLayoutRenderResult
        {
            Succeeded = true,
            Svg = sanitized.SanitizedContent,
        };
    }

    private static GraphvizLayoutRenderResult Failed(string error)
    {
        return new GraphvizLayoutRenderResult
        {
            Succeeded = false,
            Error = error,
        };
    }

    internal static string? ResolveBinaryPath(string configuredPath)
    {
        if (string.IsNullOrWhiteSpace(configuredPath))
        {
            return null;
        }

        if (Path.IsPathRooted(configuredPath) && File.Exists(configuredPath))
        {
            return configuredPath;
        }

        string? pathEnv = Environment.GetEnvironmentVariable("PATH");

        if (string.IsNullOrWhiteSpace(pathEnv))
        {
            return null;
        }

        foreach (string directory in pathEnv.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            string candidate = Path.Combine(directory.Trim(), configuredPath);

            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }
}
