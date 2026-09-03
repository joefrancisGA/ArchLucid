namespace ArchLucid.Cli.Commands;

/// <summary>
///     Interactive Socratic intake via <c>archlucid draft new</c> — create, admit, answer MUST questions, submit.
/// </summary>
internal static class DraftNewCommand
{
    public static Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        DraftNewCommandOptions? options = DraftNewCommandOptions.Parse(args, out string? parseError);

        if (options is null)
        {
            Console.WriteLine(parseError);
            DraftNewCommandOptions.WriteUsage();

            return Task.FromResult(CliExitCode.UsageError);
        }

        return DraftNewCommandIntakeLoop.RunCoreAsync(options, new DraftNewCommandHooks(), Console.Out, Console.Error, cancellationToken);
    }

    internal static Task<int> RunCoreAsync(
        DraftNewCommandOptions options,
        DraftNewCommandHooks hooks,
        TextWriter output,
        TextWriter error,
        CancellationToken cancellationToken = default) =>
        DraftNewCommandIntakeLoop.RunCoreAsync(options, hooks, output, error, cancellationToken);
}
