using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Cli.Commands;

/// <summary><c>archlucid draft clone-snapshot</c> — SN-036 CLI parity for spawn-locked new version (SN-008).</summary>
[ExcludeFromCodeCoverage(Justification = "Thin HTTP orchestration; covered by DraftCloneSnapshotCommandTests.")]
internal static class DraftCloneSnapshotCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        if (args.Any(static arg => string.Equals(arg, "--help", StringComparison.OrdinalIgnoreCase)))
        {
            DraftCloneSnapshotHonesty.WriteHelp();

            return CliExitCode.Success;
        }

        if (!TryParseArgs(args, out Guid draftId, out string? parseError))
        {
            await Console.Error.WriteLineAsync(parseError);
            DraftCloneSnapshotHonesty.WriteHelp();

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome connection = await CliCommandShared.TryConnectToApiAsync(baseUrl, config);

        if (connection != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(connection);

        ArchLucidApiClient client = new(baseUrl, config);

        return await RunCoreAsync(
            draftId,
            client,
            config,
            Console.Out,
            Console.Error,
            cancellationToken);
    }

    internal static async Task<int> RunCoreAsync(
        Guid sourceDraftId,
        ArchLucidApiClient client,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        TextWriter output,
        TextWriter error,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(output);
        ArgumentNullException.ThrowIfNull(error);

        if (!CliExecutionContext.JsonOutput)
            await DraftCloneSnapshotHonesty.WriteStdoutBannerAsync(output, cancellationToken);

        ArchLucidApiClient.DraftApiResult<CloneSnapshotDraftResponse> cloned =
            await client.CloneDraftSnapshotAsync(sourceDraftId, cancellationToken);

        if (!cloned.Success || cloned.Value is null)
        {
            await error.WriteLineAsync($"Error cloning draft snapshot: {cloned.Error}");
            CliOperatorHints.WriteAfterApiFailure(cloned.HttpStatusCode, cloned.Error, error);

            return CliExitCode.OperationFailed;
        }

        CloneSnapshotDraftResponse response = cloned.Value;

        if (!CliScopeResponseValidator.TryValidateDraftScope(response.Clone, config, out string? scopeError))
        {
            await error.WriteLineAsync($"Error cloning draft snapshot: {scopeError}");
            CliOperatorHints.WriteAfterScopeMismatch(error);

            return CliExitCode.OperationFailed;
        }

        if (CliExecutionContext.JsonOutput)
        {
            CliJson.WriteSuccessLine(
                output,
                new
                {
                    ok = true,
                    sourceDraftId = response.SourceDraftId,
                    sourceSpawnedRunId = response.SourceSpawnedRunId,
                    cloneDraftId = response.Clone.DraftId,
                    cloneArchitectureId = response.Clone.ArchitectureId,
                    cloneStatus = response.Clone.Status.ToString(),
                    honesty = new
                    {
                        careerRehearsalRule = DraftCloneSnapshotHonesty.CareerRehearsalRuleLine,
                        simulatorCareerBlock = DraftCloneSnapshotHonesty.SimulatorCareerBlockLine,
                        casPatchReminder = DraftCloneSnapshotHonesty.CasPatchReminderLine,
                    },
                });

            return CliExitCode.Success;
        }

        await output.WriteLineAsync($"SourceDraftId: {response.SourceDraftId:D}");
        await output.WriteLineAsync($"CloneDraftId: {response.Clone.DraftId:D}");

        if (!string.IsNullOrWhiteSpace(response.SourceSpawnedRunId))
            await output.WriteLineAsync($"SourceSpawnedRunId: {response.SourceSpawnedRunId}");

        if (response.Clone.ArchitectureId is Guid architectureId)
            await output.WriteLineAsync($"CloneArchitectureId: {architectureId:D}");

        await output.WriteLineAsync($"CloneStatus: {response.Clone.Status}");
        await output.WriteLineAsync(
            "Next: edit the clone in the operator UI or patch with ExpectedUpdatedUtc before submit.");

        return CliExitCode.Success;
    }

    private static bool TryParseArgs(string[] args, out Guid draftId, out string? error)
    {
        draftId = Guid.Empty;
        error = null;

        foreach (string arg in args)
        {
            if (string.Equals(arg, "--json", StringComparison.OrdinalIgnoreCase))
                continue;

            if (arg.StartsWith('-'))
            {
                error = $"Unknown argument for 'draft clone-snapshot': {arg}.";

                return false;
            }

            if (draftId != Guid.Empty)
            {
                error = "Expected a single draftId argument.";

                return false;
            }

            if (!Guid.TryParse(arg, out draftId))
            {
                error = "draftId must be a GUID.";

                return false;
            }
        }

        if (draftId == Guid.Empty)
        {
            error = "draftId is required.";

            return false;
        }

        return true;
    }
}
