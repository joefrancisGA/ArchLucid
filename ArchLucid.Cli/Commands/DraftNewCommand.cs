using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Interactive Socratic intake via <c>archlucid draft new</c> — create, admit, answer MUST questions, submit.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "CLI orchestration; covered via DraftNewCommandCoreTests with injected hooks.")]
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

        return RunCoreAsync(options, new DraftNewCommandHooks(), Console.Out, Console.Error, cancellationToken);
    }

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

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = options.ApiBaseUrlFromArgument
            ? options.ApiBaseUrl.TrimEnd('/')
            : ArchLucidApiClient.ResolveBaseUrl(config);

        ApiConnectionOutcome connection = await hooks.ConnectAsync(baseUrl, cancellationToken);

        if (connection is not ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(connection);

        string intent = options.IntentText?.Trim() ?? string.Empty;

        if (options.IntentText is not null)
        {

            if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            {
                await error.WriteLineAsync(
                    $"Intent must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters after trim.");

                return CliExitCode.UsageError;
            }
        }
        else if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
        {
            string? prompted = await hooks.PromptRequiredAsync(
                $"Describe the architecture you want reviewed (minimum {DraftIntakeValidation.MinimumFreeTextIntentLength} characters):",
                output,
                cancellationToken);

            if (prompted is null)
                return CliExitCode.OperationFailed;

            intent = prompted;

            if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            {
                await error.WriteLineAsync(
                    $"Intent must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters after trim.");

                return CliExitCode.UsageError;
            }
        }

        ArchLucidApiClient client = hooks.CreateApiClient(baseUrl, config);
        ArchLucidApiClient.DraftApiResult<DraftRequestResponse> created =
            await client.CreateDraftAsync(intent, cancellationToken);

        if (!created.Success || created.Value is null)
        {
            await error.WriteLineAsync($"Error creating draft: {created.Error}");
            CliOperatorHints.WriteAfterApiFailure(created.HttpStatusCode, created.Error, error);

            return CliExitCode.OperationFailed;
        }

        if (!CliScopeResponseValidator.TryValidateDraftScope(created.Value, config, out string? createScopeError))
        {
            await error.WriteLineAsync($"Error creating draft: {createScopeError}");
            CliOperatorHints.WriteAfterScopeMismatch(error);

            return CliExitCode.OperationFailed;
        }

        Guid draftId = created.Value.DraftId;
        await output.WriteLineAsync($"DraftId: {draftId}");

        string systemName = options.SystemName?.Trim() ?? string.Empty;

        if (systemName.Length == 0)
        {
            string? promptedName = await hooks.PromptRequiredAsync(
                "System name (short label for this architecture):",
                output,
                cancellationToken);

            if (promptedName is null)
                return CliExitCode.OperationFailed;

            systemName = promptedName;
        }

        string businessOutcome = options.BusinessOutcome?.Trim() ?? string.Empty;

        if (businessOutcome.Length == 0)
        {
            string? promptedOutcome = await hooks.PromptRequiredAsync(
                "Business outcome this architecture must achieve:",
                output,
                cancellationToken);

            if (promptedOutcome is null)
                return CliExitCode.OperationFailed;

            businessOutcome = promptedOutcome;
        }

        PatchDraftRequest patch = new()
        {
            FreeTextIntent = intent,
            SystemName = systemName,
            BusinessOutcome = businessOutcome,
            ActorSet = DraftIntakeDefaultActorFactory.CreatePrimaryOperatorActorSet(),
        };

        ArchLucidApiClient.DraftApiResult<DraftRequestResponse> patched =
            await client.PatchDraftAsync(draftId, patch, cancellationToken);

        if (!patched.Success || patched.Value is null)
        {
            await error.WriteLineAsync($"Error patching draft: {patched.Error}");
            CliOperatorHints.WriteAfterApiFailure(patched.HttpStatusCode, patched.Error, error);

            return CliExitCode.OperationFailed;
        }

        if (!CliScopeResponseValidator.TryValidateDraftScope(patched.Value, config, out string? patchScopeError))
        {
            await error.WriteLineAsync($"Error patching draft: {patchScopeError}");
            CliOperatorHints.WriteAfterScopeMismatch(error);

            return CliExitCode.OperationFailed;
        }

        ArchLucidApiClient.DraftApiResult<DraftAdmissionResponse> admission =
            await client.AdmitDraftAsync(draftId, cancellationToken);

        if (!admission.Success || admission.Value is null)
        {
            await error.WriteLineAsync($"Error admitting draft: {admission.Error}");
            CliOperatorHints.WriteAfterApiFailure(admission.HttpStatusCode, admission.Error, error);

            return CliExitCode.OperationFailed;
        }

        if (!admission.Value.Admitted)
        {
            await error.WriteLineAsync(
                $"Draft was not admitted: {admission.Value.RedirectReason ?? "semantic admission gate redirected the request."}");
            CliOperatorHints.WriteAfterApiFailure(admission.HttpStatusCode, admission.Value.RedirectReason, error);

            return CliExitCode.OperationFailed;
        }

        if (!CliScopeResponseValidator.TryValidateDraftScope(admission.Value.Draft, config, out string? admitScopeError))
        {
            await error.WriteLineAsync($"Error admitting draft: {admitScopeError}");
            CliOperatorHints.WriteAfterScopeMismatch(error);

            return CliExitCode.OperationFailed;
        }

        await output.WriteLineAsync("Draft admitted. Resolving MUST questions...");

        int resolveExit = await ResolveMustQuestionsAsync(
            client,
            draftId,
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
                });
        }
        else
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

                return CliExitCode.OperationFailed;
            }

            await output.WriteLineAsync($"Execution started for run {runId}.");
            await output.WriteLineAsync($"Next: archlucid status {runId}");
            await output.WriteLineAsync($"When ready: archlucid commit {runId}");
        }
        else
        {
            await output.WriteLineAsync($"Next: execute the review, then 'archlucid status {runId}' and 'archlucid commit {runId}'.");
        }

        return CliExitCode.Success;
    }

    private static async Task<int> ResolveMustQuestionsAsync(
        ArchLucidApiClient client,
        Guid draftId,
        bool skipAll,
        DraftNewCommandHooks hooks,
        TextWriter output,
        TextWriter error,
        CancellationToken cancellationToken)
    {
        ArchLucidApiClient.DraftApiResult<DraftQuestionsResponse> questionsResult =
            await client.GetDraftQuestionsAsync(draftId, cancellationToken);

        if (!questionsResult.Success || questionsResult.Value is null)
        {
            await error.WriteLineAsync($"Error loading draft questions: {questionsResult.Error}");
            CliOperatorHints.WriteAfterApiFailure(questionsResult.HttpStatusCode, questionsResult.Error, error);

            return CliExitCode.OperationFailed;
        }

        IReadOnlyList<DraftElicitationQuestion> pending =
            questionsResult.Value.Selection.PendingMustQuestions;

        foreach (DraftElicitationQuestion question in pending)
        {
            if (skipAll)
            {
                ArchLucidApiClient.DraftApiResult<DraftRequestResponse> skipped =
                    await client.SkipDraftQuestionAsync(
                        draftId,
                        new SkipDraftQuestionRequest { QuestionKey = question.QuestionKey },
                        cancellationToken);

                if (!skipped.Success)
                {
                    await error.WriteLineAsync($"Error skipping question '{question.QuestionKey}': {skipped.Error}");
                    CliOperatorHints.WriteAfterApiFailure(skipped.HttpStatusCode, skipped.Error, error);

                    return CliExitCode.OperationFailed;
                }

                continue;
            }

            await output.WriteLineAsync(string.Empty);
            await output.WriteLineAsync($"[{question.QuestionKey}] {question.Prompt}");
            await output.WriteLineAsync("Enter an answer (or type 'skip' to leave a transparency trail skip):");

            string? answerLine = await hooks.ReadLineAsync(string.Empty, cancellationToken);

            if (answerLine is null)
                return CliExitCode.OperationFailed;

            if (string.Equals(answerLine.Trim(), "skip", StringComparison.OrdinalIgnoreCase))
            {
                ArchLucidApiClient.DraftApiResult<DraftRequestResponse> skipped =
                    await client.SkipDraftQuestionAsync(
                        draftId,
                        new SkipDraftQuestionRequest { QuestionKey = question.QuestionKey },
                        cancellationToken);

                if (!skipped.Success)
                {
                    await error.WriteLineAsync($"Error skipping question '{question.QuestionKey}': {skipped.Error}");
                    CliOperatorHints.WriteAfterApiFailure(skipped.HttpStatusCode, skipped.Error, error);

                    return CliExitCode.OperationFailed;
                }

                continue;
            }

            if (string.IsNullOrWhiteSpace(answerLine))
            {
                await error.WriteLineAsync("An answer or explicit 'skip' is required for MUST questions.");

                return CliExitCode.UsageError;
            }

            ArchLucidApiClient.DraftApiResult<DraftRequestResponse> answered =
                await client.AnswerDraftQuestionAsync(
                    draftId,
                    new AnswerDraftQuestionRequest
                    {
                        QuestionKey = question.QuestionKey,
                        Answer = answerLine.Trim(),
                    },
                    cancellationToken);

            if (!answered.Success)
            {
                await error.WriteLineAsync($"Error answering question '{question.QuestionKey}': {answered.Error}");
                CliOperatorHints.WriteAfterApiFailure(answered.HttpStatusCode, answered.Error, error);

                return CliExitCode.OperationFailed;
            }
        }

        return CliExitCode.Success;
    }
}
