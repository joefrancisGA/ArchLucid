namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid sponsor-packet</c> — one-command buyer-ready bundle for a committed run (T2-7).
/// </summary>
internal static class SponsorPacketCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        string? runId = null;
        string? outputDirectory = null;
        string? zipPath = null;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--out", StringComparison.OrdinalIgnoreCase)
                || string.Equals(token, "-o", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    await Console.Error.WriteLineAsync("Missing value for --out.");

                    return CliExitCode.UsageError;
                }

                outputDirectory = args[++i];

                continue;
            }

            if (string.Equals(token, "--zip", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    await Console.Error.WriteLineAsync("Missing value for --zip.");

                    return CliExitCode.UsageError;
                }

                zipPath = args[++i];

                continue;
            }

            if (token.StartsWith('-'))
            {
                await Console.Error.WriteLineAsync($"Unexpected flag: {token}");

                return CliExitCode.UsageError;
            }

            if (runId is not null)
            {
                await Console.Error.WriteLineAsync("Only one run id is supported.");

                return CliExitCode.UsageError;
            }

            runId = token;
        }

        if (string.IsNullOrWhiteSpace(runId))
        {
            await Console.Error.WriteLineAsync(
                "Usage: archlucid sponsor-packet <runId> [--out <dir>] [--zip <path.zip>]");

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome outcome = await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken);

        if (outcome != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(outcome);

        string resolvedOutputDirectory = outputDirectory
                                         ?? Path.Combine("artifacts", "sponsor-packet", runId.Trim());

        SponsorPacketWriteOutcome writeOutcome = await SponsorPacketWriter.WriteAsync(
            runId,
            baseUrl,
            resolvedOutputDirectory,
            config,
            Console.Error,
            cancellationToken);

        if (writeOutcome.ExitCode != CliExitCode.Success)
            return writeOutcome.ExitCode;

        await Console.Out.WriteLineAsync($"Wrote sponsor packet folder: {writeOutcome.OutputDirectory}");
        await Console.Out.WriteLineAsync($"Open {SponsorPacketArtifactCatalog.IndexFileName} for the artifact map.");

        if (string.IsNullOrWhiteSpace(zipPath))
            return CliExitCode.Success;

        int zipExit = await SponsorPacketWriter.WriteZipAsync(writeOutcome.OutputDirectory, zipPath, cancellationToken);

        if (zipExit == CliExitCode.Success)
            await Console.Out.WriteLineAsync($"Wrote sponsor packet zip: {Path.GetFullPath(zipPath)}");

        return zipExit;
    }
}
