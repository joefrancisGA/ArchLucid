using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Cli.Commands;

/// <summary>Create, patch, and admit draft stage for <see cref="DraftNewCommandIntakeLoop" />.</summary>
internal static class DraftNewCommandAdmitStage
{
    internal sealed record Success(Guid DraftId);

    internal static async Task<(Success? Result, int ExitCode)> RunAsync(
        DraftNewCommandConnectStage.Success connect,
        DraftNewCommandOptions options,
        DraftNewCommandHooks hooks,
        TextWriter output,
        TextWriter error,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(connect);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(hooks);
        ArgumentNullException.ThrowIfNull(output);
        ArgumentNullException.ThrowIfNull(error);

        ArchLucidApiClient client = connect.Client;
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = connect.Config;
        string intent = connect.Intent;

        ArchLucidApiClient.DraftApiResult<DraftRequestResponse> created =
            await client.CreateDraftAsync(intent, cancellationToken);

        if (!created.Success || created.Value is null)
        {
            await error.WriteLineAsync($"Error creating draft: {created.Error}");
            CliOperatorHints.WriteAfterApiFailure(created.HttpStatusCode, created.Error, error);

            return (null, CliExitCode.OperationFailed);
        }

        if (!CliScopeResponseValidator.TryValidateDraftScope(created.Value, config, out string? createScopeError))
        {
            await error.WriteLineAsync($"Error creating draft: {createScopeError}");
            CliOperatorHints.WriteAfterScopeMismatch(error);

            return (null, CliExitCode.OperationFailed);
        }

        Guid draftId = created.Value.DraftId;

        if (!CliExecutionContext.JsonOutput)
            await output.WriteLineAsync($"DraftId: {draftId}");

        string systemName = options.SystemName?.Trim() ?? string.Empty;

        if (systemName.Length == 0)
        {
            string? promptedName = await hooks.PromptRequiredAsync(
                "System name (short label for this architecture):",
                output,
                cancellationToken);

            if (promptedName is null)
                return (null, CliExitCode.OperationFailed);

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
                return (null, CliExitCode.OperationFailed);

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

            return (null, CliExitCode.OperationFailed);
        }

        if (!CliScopeResponseValidator.TryValidateDraftScope(patched.Value, config, out string? patchScopeError))
        {
            await error.WriteLineAsync($"Error patching draft: {patchScopeError}");
            CliOperatorHints.WriteAfterScopeMismatch(error);

            return (null, CliExitCode.OperationFailed);
        }

        ArchLucidApiClient.DraftApiResult<DraftAdmissionResponse> admission =
            await client.AdmitDraftAsync(draftId, cancellationToken);

        if (!admission.Success || admission.Value is null)
        {
            await error.WriteLineAsync($"Error admitting draft: {admission.Error}");
            CliOperatorHints.WriteAfterApiFailure(admission.HttpStatusCode, admission.Error, error);

            return (null, CliExitCode.OperationFailed);
        }

        if (!admission.Value.Admitted)
        {
            await error.WriteLineAsync(
                $"Draft was not admitted: {admission.Value.RedirectReason ?? "semantic admission gate redirected the request."}");
            CliOperatorHints.WriteAfterApiFailure(admission.HttpStatusCode, admission.Value.RedirectReason, error);

            return (null, CliExitCode.OperationFailed);
        }

        if (!CliScopeResponseValidator.TryValidateDraftScope(admission.Value.Draft, config, out string? admitScopeError))
        {
            await error.WriteLineAsync($"Error admitting draft: {admitScopeError}");
            CliOperatorHints.WriteAfterScopeMismatch(error);

            return (null, CliExitCode.OperationFailed);
        }

        if (!CliExecutionContext.JsonOutput)
            await output.WriteLineAsync("Draft admitted. Resolving MUST questions...");

        return (new Success(draftId), CliExitCode.Success);
    }
}
