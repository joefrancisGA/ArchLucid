using System.Text;
using System.Text.Json;

using ArchLucid.Cli.Commands;

namespace ArchLucid.Cli;

/// <summary>
///     Folder layout, JSON write, and claim-lint helpers for buyer proof / sponsor packet commands.
/// </summary>
internal static class BuyerPacketFolderWriter
{
    internal static readonly UTF8Encoding Utf8NoBom = new(false);

    internal static readonly JsonSerializerOptions JsonWriteIndented = new() { WriteIndented = true };

    public static string EnsureDirectory(string outputDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);

        string dir = Path.GetFullPath(outputDirectory);
        Directory.CreateDirectory(dir);

        return dir;
    }

    public static string PrettyPrintJson(string raw)
    {
        using JsonDocument doc = JsonDocument.Parse(raw);

        return JsonSerializer.Serialize(doc.RootElement, JsonWriteIndented);
    }

    public static Task WriteTextAsync(
        string directory,
        string fileName,
        string content,
        CancellationToken cancellationToken = default) =>
        File.WriteAllTextAsync(Path.Combine(directory, fileName), content, Utf8NoBom, cancellationToken);

    public static Task WriteJsonRawAsync(
        string directory,
        string fileName,
        string rawJson,
        CancellationToken cancellationToken = default) =>
        WriteTextAsync(directory, fileName, PrettyPrintJson(rawJson), cancellationToken);

    public static Task WriteJsonObjectAsync(
        string directory,
        string fileName,
        object payload,
        CancellationToken cancellationToken = default) =>
        WriteTextAsync(
            directory,
            fileName,
            JsonSerializer.Serialize(payload, JsonWriteIndented),
            cancellationToken);

    public static string? TryReadText(string path) =>
        File.Exists(path) ? File.ReadAllText(path, Encoding.UTF8) : null;

    /// <summary>
    ///     Scans the output folder for sponsor-unsafe claims unless <paramref name="skipClaimLint" /> is set.
    ///     Returns <see cref="CliExitCode.Success" /> when clean or skipped; otherwise
    ///     <see cref="CliExitCode.OperationFailed" /> after writing violations to <paramref name="errorWriter" />.
    /// </summary>
    public static int RunClaimLintOrFail(
        string outputDirectory,
        bool skipClaimLint,
        TextWriter errorWriter)
    {
        ArgumentNullException.ThrowIfNull(errorWriter);

        if (skipClaimLint)
            return CliExitCode.Success;

        IReadOnlyList<ProofPacketClaimLintViolation> violations = ProofPacketClaimLinter.ScanDirectory(outputDirectory);

        if (violations.Count == 0)
            return CliExitCode.Success;

        ProofPacketClaimLinter.WriteViolations(errorWriter, violations);

        return CliExitCode.OperationFailed;
    }
}
