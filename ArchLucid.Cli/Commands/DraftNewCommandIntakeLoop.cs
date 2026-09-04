using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Core intake loop for <see cref="DraftNewCommand" /> — create, admit, resolve MUST questions, submit, execute.
/// </summary>
internal static class DraftNewCommandIntakeLoop
{
    internal static async Task<int> RunCoreAsync(
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

        if (CliExecutionContext.JsonOutput)
        {
            int jsonFlagsExit = await TryValidateJsonModeRequiredFlagsAsync(options, error);

            if (jsonFlagsExit != CliExitCode.Success)
                return jsonFlagsExit;
        }

        (DraftNewCommandConnectStage.Success? connect, int connectExit) =
            await DraftNewCommandConnectStage.RunAsync(options, hooks, output, error, cancellationToken);

        if (connect is null)
            return connectExit;

        (DraftNewCommandAdmitStage.Success? admitted, int admitExit) =
            await DraftNewCommandAdmitStage.RunAsync(connect, options, hooks, output, error, cancellationToken);

        if (admitted is null)
            return admitExit;

        Guid draftId = admitted.DraftId;
        ArchLucidApiClient client = connect.Client;

        int resolveExit = await DraftNewCommandMustQuestionLoop.RunAsync(
            client,
            draftId,
            connect.Config,
            options.SkipMustQuestions,
            hooks,
            output,
            error,
            cancellationToken);

        if (resolveExit != CliExitCode.Success)
            return resolveExit;

        ArchLucidApiClient.DraftApiResult<SubmitDraftResponse> submit =
            await client.SubmitDraftAsync(draftId, cancellationToken);

        if (!submit.Success || submit.Value is null)
        {
            await error.WriteLineAsync($"Error submitting draft: {submit.Error}");
            CliOperatorHints.WriteAfterApiFailure(submit.HttpStatusCode, submit.Error, error);

            return CliExitCode.OperationFailed;
        }

        string runId = submit.Value.RunId?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(runId))
        {
            await error.WriteLineAsync(
                "Error submitting draft: API returned success but no runId. The review was not spawned.");

            CliOperatorHints.WriteAfterApiFailure(submit.HttpStatusCode, submit.Error, error);

            return CliExitCode.OperationFailed;
        }

        string requestId = submit.Value.RequestId;

        if (!CliExecutionContext.JsonOutput)
        {
            await output.WriteLineAsync($"RunId: {runId}");
            await output.WriteLineAsync($"RequestId: {requestId}");
        }

        if (!options.NoAutoExecute)
        {
            ArchLucidApiClient.ExecuteRunResult? executed = await client.ExecuteRunAsync(runId, cancellationToken);

            if (executed is null || !executed.Success)
            {
                await error.WriteLineAsync(
                    $"Review created but execute failed: {executed?.Error ?? "unknown"}. "
                    + $"Poll with 'archlucid status {runId}' and execute via the operator UI.");
                CliOperatorHints.WriteAfterApiFailure(executed?.HttpStatusCode, executed?.Error, error);

                if (CliExecutionContext.JsonOutput)
                {
                    CliJson.WriteFailureLine(
                        output,
                        CliExitCode.OperationFailed,
                        "execute_failed",
                        executed?.Error ?? "unknown");
                }

                return CliExitCode.OperationFailed;
            }

            if (!CliExecutionContext.JsonOutput)
            {
                await output.WriteLineAsync($"Execution started for run {runId}.");
                await output.WriteLineAsync($"Next: archlucid status {runId}");
                await output.WriteLineAsync($"When ready: archlucid commit {runId}");
            }
        }
        else if (!CliExecutionContext.JsonOutput)
        {
            await output.WriteLineAsync($"Next: execute the review, then 'archlucid status {runId}' and 'archlucid commit {runId}'.");
        }

        if (CliExecutionContext.JsonOutput)
        {
            CliJson.WriteSuccessLine(
                output,
                new
                {
                    ok = true,
                    draftId,
                    runId,
                    requestId,
                    status = submit.Value.Status.ToString(),
                    executionStarted = !options.NoAutoExecute,
                });
        }

        return CliExitCode.Success;
    }

    private static async Task<int> TryValidateJsonModeRequiredFlagsAsync(DraftNewCommandOptions options, TextWriter error)
    {
        if (options.IntentText is null)
        {
            await error.WriteLineAsync("JSON output mode requires --text <intent>.");

            return CliExitCode.UsageError;
        }

        if (string.IsNullOrWhiteSpace(options.SystemName))
        {
            await error.WriteLineAsync("JSON output mode requires --system-name <name>.");

            return CliExitCode.UsageError;
        }

        if (string.IsNullOrWhiteSpace(options.BusinessOutcome))
        {
            await error.WriteLineAsync("JSON output mode requires --business-outcome <text>.");

            return CliExitCode.UsageError;
        }

        return CliExitCode.Success;
    }
}
