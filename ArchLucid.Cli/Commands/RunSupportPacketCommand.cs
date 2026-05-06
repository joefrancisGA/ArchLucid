using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Emits a paste-friendly operator/support summary for one run (HTTP projection only — no SQL).
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "Orchestrates ArchLucidApiClient calls; formatting covered by RunSupportPacketFormatterTests.")]
internal static class RunSupportPacketCommand
{
    private static readonly JsonSerializerOptions JsonCamel =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = false };

    public static async Task<int> RunAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);

        ApiConnectionOutcome connection =
            await CliCommandShared.TryConnectToApiAsync(baseUrl, config, cancellationToken).ConfigureAwait(false);

        if (connection != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(connection);

        ArchLucidApiClient client = new(baseUrl, config);

        return await RunCoreAsync(
                runId,
                ct => client.GetRunAsync(runId, ct),
                ct => client.GetVersionJsonAsync(ct),
                baseUrl,
                Console.Out,
                cancellationToken)
            .ConfigureAwait(false);
    }

    internal static async Task<int> RunCoreAsync(
        string runId,
        Func<CancellationToken, Task<ArchLucidApiClient.GetRunResult?>> fetchRun,
        Func<CancellationToken, Task<string?>> fetchVersionJson,
        string apiBaseUrl,
        TextWriter output,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(fetchRun);
        ArgumentNullException.ThrowIfNull(fetchVersionJson);
        ArgumentNullException.ThrowIfNull(apiBaseUrl);
        ArgumentNullException.ThrowIfNull(output);

        ArchLucidApiClient.GetRunResult? detail = await fetchRun(cancellationToken).ConfigureAwait(false);

        if (detail is null)
        {
            await output.WriteLineAsync(
                    $"Run '{runId}' not found. Ensure the ArchLucid API is running and the id is correct.")
                .ConfigureAwait(false);

            return CliExitCode.OperationFailed;
        }

        string? versionJson = await fetchVersionJson(cancellationToken).ConfigureAwait(false);

        if (CliExecutionContext.JsonOutput)
        {
            RunSupportPacketPayload payload = RunSupportPacketFormatter.BuildPayload(apiBaseUrl, versionJson, detail);
            await output.WriteLineAsync(JsonSerializer.Serialize(payload, JsonCamel)).ConfigureAwait(false);

            return CliExitCode.Success;
        }

        string text = RunSupportPacketFormatter.FormatPlainText(apiBaseUrl, versionJson, detail);
        await output.WriteLineAsync(text).ConfigureAwait(false);

        return CliExitCode.Success;
    }
}
