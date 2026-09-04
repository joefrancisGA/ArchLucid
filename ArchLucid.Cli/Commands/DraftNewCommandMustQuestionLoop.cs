using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Cli.Commands;

/// <summary>MUST-question resolution loop for <see cref="DraftNewCommandIntakeLoop" />.</summary>
internal static class DraftNewCommandMustQuestionLoop
{
    internal static async Task<int> RunAsync(
        ArchLucidApiClient client,
        Guid draftId,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        bool skipAll,
        DraftNewCommandHooks hooks,
        TextWriter output,
        TextWriter error,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(hooks);
        ArgumentNullException.ThrowIfNull(output);
        ArgumentNullException.ThrowIfNull(error);

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

                if (skipped.Value is not null
                    && !CliScopeResponseValidator.TryValidateDraftScope(skipped.Value, config, out string? skipScopeError))
                {
                    await error.WriteLineAsync($"Error skipping question '{question.QuestionKey}': {skipScopeError}");
                    CliOperatorHints.WriteAfterScopeMismatch(error);

                    return CliExitCode.OperationFailed;
                }

                continue;
            }

            if (!CliExecutionContext.JsonOutput)
            {
                await output.WriteLineAsync(string.Empty);
                await output.WriteLineAsync($"[{question.QuestionKey}] {question.Prompt}");
                await output.WriteLineAsync("Enter an answer (or type 'skip' to leave a transparency trail skip):");
            }

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

                if (skipped.Value is not null
                    && !CliScopeResponseValidator.TryValidateDraftScope(skipped.Value, config, out string? skipScopeError))
                {
                    await error.WriteLineAsync($"Error skipping question '{question.QuestionKey}': {skipScopeError}");
                    CliOperatorHints.WriteAfterScopeMismatch(error);

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

            if (answered.Value is not null
                && !CliScopeResponseValidator.TryValidateDraftScope(answered.Value, config, out string? answerScopeError))
            {
                await error.WriteLineAsync($"Error answering question '{question.QuestionKey}': {answerScopeError}");
                CliOperatorHints.WriteAfterScopeMismatch(error);

                return CliExitCode.OperationFailed;
            }
        }

        return CliExitCode.Success;
    }
}
