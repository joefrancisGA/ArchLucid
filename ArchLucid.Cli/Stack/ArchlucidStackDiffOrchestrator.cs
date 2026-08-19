namespace ArchLucid.Cli.Stack;

/// <summary>Compares generated artifacts on disk with freshly generated content.</summary>
internal static class ArchlucidStackDiffOrchestrator
{
    internal sealed record FileDiff(string RelativePath, bool MissingOnDisk, bool ContentDiffers);

    internal sealed record Result(int ExitCode, IReadOnlyList<string> Messages, IReadOnlyList<FileDiff> Diffs);

    internal static Result Run(StackDiffOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!ArchlucidStackWorkspaceResolver.TryResolveRepositoryRoot(options.RepositoryRoot, out string? repositoryRoot))
            return Fail(CliExitCode.OperationFailed, "Could not locate ArchLucid repository root.");

        string answersPath = ArchlucidStackWorkspaceResolver.ResolveAnswersPath(
            repositoryRoot,
            options.AnswersPath,
            fromExample: false);

        if (!File.Exists(answersPath))
            return Fail(CliExitCode.UsageError, $"Stack answers file not found: {answersPath}");

        ArchlucidStackDocument document;

        try
        {
            document = ArchlucidStackDocumentParser.ParseFile(answersPath);
        }
        catch (Exception ex)
        {
            return Fail(CliExitCode.OperationFailed, $"Could not parse stack answers: {ex.Message}");
        }

        ArchlucidStackSchemaValidator.Evaluation validation = ArchlucidStackSchemaValidator.ValidateDocument(document);

        if (!validation.IsValid)
        {
            List<string> messages = new() { "Stack answers failed schema validation:" };
            messages.AddRange(validation.Errors);

            return new Result(CliExitCode.OperationFailed, messages, Array.Empty<FileDiff>());
        }

        string outputDirectory = ArchlucidStackWorkspaceResolver.ResolveOutputDirectory(
            repositoryRoot,
            options.OutputDirectory,
            document.Azure.Environment);

        ArchlucidStackGeneratedArtifacts expected = ArchlucidStackArtifactGenerator.Generate(document);
        List<FileDiff> diffs = new();

        foreach (KeyValuePair<string, string> entry in expected.FilesByRelativePath)
        {
            string targetPath = Path.Combine(outputDirectory, entry.Key);

            if (!File.Exists(targetPath))
            {
                diffs.Add(new FileDiff(entry.Key, MissingOnDisk: true, ContentDiffers: true));
                continue;
            }

            string onDisk = File.ReadAllText(targetPath);
            bool differs = !string.Equals(Normalize(onDisk), Normalize(entry.Value), StringComparison.Ordinal);

            if (differs)
                diffs.Add(new FileDiff(entry.Key, MissingOnDisk: false, ContentDiffers: true));
        }

        if (diffs.Count == 0)
        {
            return new Result(
                CliExitCode.Success,
                new[] { $"stack diff OK: {outputDirectory} matches answers file." },
                diffs);
        }

        List<string> driftMessages = new() { $"stack diff: {diffs.Count} file(s) drift from answers file:" };

        foreach (FileDiff diff in diffs)
        {
            string status = diff.MissingOnDisk ? "missing" : "content differs";
            driftMessages.Add($"  - {diff.RelativePath} ({status})");
        }

        driftMessages.Add("Run `archlucid stack init --force` to regenerate.");

        return new Result(CliExitCode.OperationFailed, driftMessages, diffs);
    }

    private static string Normalize(string content)
    {
        return content.Replace("\r\n", "\n", StringComparison.Ordinal).TrimEnd();
    }

    private static Result Fail(int exitCode, string message)
    {
        return new Result(exitCode, new[] { message }, Array.Empty<FileDiff>());
    }
}
