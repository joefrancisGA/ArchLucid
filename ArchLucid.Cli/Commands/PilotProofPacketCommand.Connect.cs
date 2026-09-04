namespace ArchLucid.Cli.Commands;

internal static partial class PilotProofPacketCommand
{
    private static async Task<(int ExitCode, string NormalizedBaseUrl, ArchLucidProjectScaffolder.ArchLucidCliConfig? Config)>
        ConnectAsync(CancellationToken cancellationToken)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome outcome = await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken);

        if (outcome != ApiConnectionOutcome.Connected)
            return (CliCommandShared.ExitCodeForFailedConnection(outcome), string.Empty, config);

        string normalized = baseUrl.Trim().TrimEnd('/');

        return (CliExitCode.Success, normalized, config);
    }
}
