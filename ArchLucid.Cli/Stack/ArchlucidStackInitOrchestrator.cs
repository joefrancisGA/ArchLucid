namespace ArchLucid.Cli.Stack;

/// <summary>Testable orchestration for <c>archlucid stack init</c>.</summary>
internal static class ArchlucidStackInitOrchestrator
{
    internal sealed record Result(int ExitCode, IReadOnlyList<string> Messages, string? OutputDirectory);

    internal static Result Run(StackInitOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!ArchlucidStackWorkspaceResolver.TryResolveRepositoryRoot(options.RepositoryRoot, out string? repositoryRoot))
            return Fail(CliExitCode.OperationFailed, "Could not locate ArchLucid repository root.");

        string answersPath = ArchlucidStackWorkspaceResolver.ResolveAnswersPath(
            repositoryRoot,
            options.AnswersPath,
            options.FromExample);

        if (options.FromExample && !File.Exists(answersPath))
            return Fail(CliExitCode.OperationFailed, $"Example stack file missing: {answersPath}");

        if (!options.FromExample && !File.Exists(answersPath))
            return Fail(
                CliExitCode.UsageError,
                $"Stack answers file not found: {answersPath}. Run `archlucid stack init --from-example` first.");

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

            return new Result(CliExitCode.OperationFailed, messages, null);
        }

        string outputDirectory = ArchlucidStackWorkspaceResolver.ResolveOutputDirectory(
            repositoryRoot,
            options.OutputDirectory,
            document.Azure.Environment);

        if (Directory.Exists(outputDirectory) && !options.Force)
        {
            return Fail(
                CliExitCode.UsageError,
                $"Output directory already exists: {outputDirectory}. Pass --force to overwrite generated files.");
        }

        ArchlucidStackGeneratedArtifacts artifacts = ArchlucidStackArtifactGenerator.Generate(document);
        Directory.CreateDirectory(outputDirectory);

        foreach (KeyValuePair<string, string> entry in artifacts.FilesByRelativePath)
        {
            string targetPath = Path.Combine(outputDirectory, entry.Key);

            if (File.Exists(targetPath) && !options.Force)
                continue;

            File.WriteAllText(targetPath, entry.Value);
        }

        List<string> successMessages = new()
        {
            $"Wrote {artifacts.FilesByRelativePath.Count} artifacts to {outputDirectory}",
            $"Source answers: {answersPath}",
            "Next: copy tfvars fragments into per-root terraform.tfvars (gitignored) and populate Key Vault secrets from key-vault-secret-checklist.md.",
        };

        return new Result(CliExitCode.Success, successMessages, outputDirectory);
    }

    private static Result Fail(int exitCode, string message)
    {
        return new Result(exitCode, new[] { message }, null);
    }
}
