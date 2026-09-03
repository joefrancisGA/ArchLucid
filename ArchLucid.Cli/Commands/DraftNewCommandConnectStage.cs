using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Cli.Commands;

/// <summary>Connect + intent resolution stage for <see cref="DraftNewCommandIntakeLoop" />.</summary>
internal static class DraftNewCommandConnectStage
{
    internal sealed record Success(
        string BaseUrl,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? Config,
        ArchLucidApiClient Client,
        string Intent);

    internal static async Task<(Success? Result, int ExitCode)> RunAsync(
        DraftNewCommandOptions options,
        DraftNewCommandHooks hooks,
        TextWriter output,
        TextWriter error,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(hooks);
        ArgumentNullException.ThrowIfNull(output);
        ArgumentNullException.ThrowIfNull(error);

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = options.ApiBaseUrlFromArgument
            ? options.ApiBaseUrl.TrimEnd('/')
            : ArchLucidApiClient.ResolveBaseUrl(config);

        ApiConnectionOutcome connection = await hooks.ConnectAsync(baseUrl, cancellationToken);

        if (connection is not ApiConnectionOutcome.Connected)
            return (null, CliCommandShared.ExitCodeForFailedConnection(connection));

        string intent = options.IntentText?.Trim() ?? string.Empty;

        if (options.IntentText is not null)
        {
            if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            {
                await error.WriteLineAsync(
                    $"Intent must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters after trim.");

                return (null, CliExitCode.UsageError);
            }
        }
        else if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
        {
            string? prompted = await hooks.PromptRequiredAsync(
                $"Describe the architecture you want reviewed (minimum {DraftIntakeValidation.MinimumFreeTextIntentLength} characters):",
                output,
                cancellationToken);

            if (prompted is null)
                return (null, CliExitCode.OperationFailed);

            intent = prompted;

            if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            {
                await error.WriteLineAsync(
                    $"Intent must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters after trim.");

                return (null, CliExitCode.UsageError);
            }
        }

        ArchLucidApiClient client = hooks.CreateApiClient(baseUrl, config);

        return (new Success(baseUrl, config, client, intent), CliExitCode.Success);
    }
}
