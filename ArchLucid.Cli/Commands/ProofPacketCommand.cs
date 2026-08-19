namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid proof-packet</c> — buyer-safe ZIP from a committed run (assessment Tier 2 #16).
///     Reuses <see cref="PilotProofPacketCommand.WriteFolderAsync" /> for assembly and redaction.
/// </summary>
internal static class ProofPacketCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        if (args.Any(static token =>
                string.Equals(token, "--help", StringComparison.OrdinalIgnoreCase)
                || string.Equals(token, "-h", StringComparison.OrdinalIgnoreCase)
                || string.Equals(token, "-?", StringComparison.OrdinalIgnoreCase)))
        {
            WriteHelp();

            return CliExitCode.Success;
        }

        ProofPacketCommandOptions? options = ProofPacketCommandOptions.TryParse(args, out string? parseError);

        if (options is null)
        {
            await Console.Error.WriteLineAsync(parseError ?? "Invalid arguments.");
            WriteHelp();

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome outcome = await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken);

        if (outcome != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(outcome);

        string normalized = baseUrl.Trim().TrimEnd('/');
        string stagingDirectory = Path.Combine(Path.GetTempPath(), "ArchLucidProofPacket." + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(stagingDirectory);

            PilotProofPacketWriteOutcome writeOutcome = await PilotProofPacketCommand.WriteFolderAsync(
                options.RunId,
                normalized,
                stagingDirectory,
                config,
                Console.Error,
                cancellationToken,
                skipClaimLint: options.SkipClaimLint);

            if (writeOutcome.ExitCode != CliExitCode.Success)
                return writeOutcome.ExitCode;

            await ProofPacketZipWriter.WriteDirectoryToZipAsync(
                writeOutcome.OutputDirectory,
                options.OutputZipPath,
                cancellationToken);

            await Console.Out.WriteLineAsync($"Wrote buyer-safe proof packet: {Path.GetFullPath(options.OutputZipPath)}");

            return CliExitCode.Success;
        }
        finally
        {
            if (Directory.Exists(stagingDirectory))
            {
                try
                {
                    Directory.Delete(stagingDirectory, recursive: true);
                }
                catch (IOException)
                {
                    // Best-effort temp cleanup on Windows file locks.
                }
            }
        }
    }

    internal static void WriteHelp()
    {
        const string help =
            """
            Usage: archlucid proof-packet --runId <runId> --out <path.zip>

            Builds a buyer-safe ZIP for one committed architecture review by reusing the pilot
            proof-packet assembler (redacted manifest summary, ROI sources, audit id slice, limitations).

            Data policy:
              - Requires committed run posture (proofPackageCompleteness.runInCommittedStatus).
              - Omits audit DataJson payloads, secrets, and full tenant identifiers.
              - Includes SOURCE-LABELS.txt describing each included API source and sponsor-send caveats.
              - Aborts with a clear error when the buyer-safe commit gate fails.
            - Runs proof-packet claim lint on markdown/text artifacts before writing the ZIP (see --skip-claim-lint).

            Requires API connectivity (ARCHLUCID_API_URL or .archlucid/config.json) and optional ARCHLUCID_API_KEY.

            Related: archlucid pilot proof-packet <runId> [--out <dir>]  (folder output, same assembler)
                     archlucid buyer-proof-pack <runId> --out <path.zip>  (email-sized sponsor pack variant)
            """;

        Console.WriteLine(help);
    }
}
