namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid pilot proof-packet</c> — buyer-safe folder with assessment filenames after a committed run.
/// </summary>
internal static partial class PilotProofPacketCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        PilotProofPacketCommandOptions? options = PilotProofPacketCommandArgParser.Parse(args, out string? parseError);

        if (options is null)
        {
            await Console.Error.WriteLineAsync(parseError);

            return CliExitCode.UsageError;
        }

        (int connectExitCode, string normalized, ArchLucidProjectScaffolder.ArchLucidCliConfig? config) =
            await ConnectAsync(cancellationToken);

        if (connectExitCode != CliExitCode.Success)
            return connectExitCode;

        string resolvedOutputDirectory = options.OutputDirectory
                                         ?? Path.Combine(Directory.GetCurrentDirectory(), "proof-packet", options.RunId);

        PilotProofPacketWriteOutcome writeOutcome = await WriteFolderAsync(
            options.RunId,
            normalized,
            resolvedOutputDirectory,
            config,
            Console.Error,
            cancellationToken,
            options.SkipClaimLint);

        if (writeOutcome.ExitCode == CliExitCode.Success)
            await Console.Out.WriteLineAsync($"Wrote buyer proof packet folder: {writeOutcome.OutputDirectory}");

        return writeOutcome.ExitCode;
    }
}
