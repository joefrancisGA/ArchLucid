using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.GoldenCorpus;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid golden-cohort drift</c> — compare live cohort output (SHA + optional finding categories) with
///     <c>cohort.json</c> expectations, with optional real-LLM JSON structural checks.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "HTTP orchestration; core logic in ArchLucid.Core.GoldenCorpus and tests.")]
internal static class GoldenCohortDriftCommand
{
    public static async Task<int> RunAsync(string[] args)
    {
        GoldenCohortDriftCommandOptions? options = GoldenCohortDriftCommandArgParser.Parse(args, out string? parseError);

        if (options is null)
        {
            await Console.Error.WriteLineAsync(parseError);

            return CliExitCode.UsageError;
        }

        if (options.StrictReal && !GoldenCohortDriftParse.IsRealLlmContext())
        {
            await Console.Error.WriteLineAsync(
                "Refusing --strict-real: set ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true and/or " +
                "ARCHLUCID_AGENT_EXECUTION_MODE/AgentExecution__Mode=Real so the gate targets a real-LLM API host.");

            return CliExitCode.UsageError;
        }

        string? repoRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();
        string resolvedCohort = string.IsNullOrWhiteSpace(options.CohortPath)
            ? Path.Combine(repoRoot ?? Directory.GetCurrentDirectory(), "tests", "golden-cohort", "cohort.json")
            : Path.GetFullPath(options.CohortPath);

        if (!File.Exists(resolvedCohort))
        {
            await Console.Error.WriteLineAsync($"Cohort file not found: {resolvedCohort}");

            return CliExitCode.UsageError;
        }

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = CliCommandShared.GetBaseUrl(config);
        ApiConnectionOutcome connection = await CliCommandShared.TryConnectToApiAsync(baseUrl, config);

        if (connection != ApiConnectionOutcome.Connected)
            return CliCommandShared.ExitCodeForFailedConnection(connection);

        ArchLucidApiClient client = new(baseUrl, config);
        GoldenCohortDocument document = GoldenCohortDocument.Load(resolvedCohort);
        int cap = document.Items.Count;
        string? capRaw = Environment.GetEnvironmentVariable("ARCHLUCID_GOLDEN_COHORT_DRIFT_ITEM_CAP");

        if (int.TryParse(capRaw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int parsedCap) && parsedCap > 0
                                                                                                        && parsedCap < cap)
            cap = parsedCap;

        bool runStructural = options.StrictReal || options.StructuralOnly;
        List<GoldenCohortDriftStructuralFailure> structuralFailures = [];

        for (int index = 0; index < cap; index++)
        {
            GoldenCohortItem item = document.Items[index];

            if (string.IsNullOrWhiteSpace(item.Id))
            {
                await Console.Error.WriteLineAsync(
                    $"Cohort item at index {index.ToString(CultureInfo.InvariantCulture)} has an empty id.");

                return CliExitCode.OperationFailed;
            }

            ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(item);
            ArchLucidApiClient.CreateRunResult created = await client.CreateRunAsync(request);

            if (!created.Success || created.Response is null)
            {
                await Console.Error.WriteLineAsync($"[{item.Id}] create failed: {created.Error}");

                return CliExitCode.OperationFailed;
            }

            string runId = created.Response.Run.RunId;
            ArchLucidApiClient.ExecuteRunResult? executed = await client.ExecuteRunAsync(runId);

            if (executed is null || !executed.Success)
            {
                await Console.Error.WriteLineAsync($"[{item.Id}] execute failed: {executed?.Error ?? "unknown"}");

                return CliExitCode.OperationFailed;
            }

            if (!options.StructuralOnly)
            {
                ArchLucidApiClient.GoldenManifestFingerprintResult? fingerprint =
                    await client.TryCommitAndFingerprintGoldenManifestAsync(runId);

                if (fingerprint is null || !fingerprint.Success ||
                    string.IsNullOrWhiteSpace(fingerprint.Sha256HexUpper))
                {
                    await Console.Error.WriteLineAsync(
                        $"[{item.Id}] commit/fingerprint failed: {fingerprint?.Error ?? "unknown"}");

                    return CliExitCode.OperationFailed;
                }

                if (!GoldenCohortDriftCompare.TryCompareCommittedSha(item, fingerprint.Sha256HexUpper, out string? shaError))
                {
                    await Console.Error.WriteLineAsync(shaError);

                    return CliExitCode.OperationFailed;
                }
            }

            ArchLucidApiClient.GetRunResult? getRun = await client.GetRunAsync(runId);

            if (getRun is null)
            {
                await Console.Error.WriteLineAsync($"[{item.Id}] get run failed.");

                return CliExitCode.OperationFailed;
            }

            if (options.StrictReal)
            {
                if (getRun.Run.RealModeFellBackToSimulator is true)
                {
                    GoldenCohortDriftStructuralFailure fb =
                        GoldenCohortDriftStructuralCheck.RealModeFallbackFailure(item, runId);
                    structuralFailures.Add(fb);
                    await Console.Out.WriteLineAsync(
                        JsonSerializer.Serialize(new { success = false, failure = fb }, ContractJson.CamelCaseIgnoreNullIndented));

                    return CliExitCode.OperationFailed;
                }
            }

            List<AgentResult>? agentResults =
                GoldenCohortDriftParse.TryParseAgentResults(getRun.Results, item.Id, out string? agentParseError);

            if (agentParseError is not null)
            {
                await Console.Error.WriteLineAsync(agentParseError);

                return CliExitCode.OperationFailed;
            }

            if (agentResults is null)
                return CliExitCode.OperationFailed;

            if (!options.StructuralOnly)
            {
                if (!GoldenCohortDriftCompare.CategoriesMatch(item, agentResults))
                {
                    await Console.Error.WriteLineAsync(
                        GoldenCohortDriftCompare.FormatCategoryMismatch(item, agentResults));

                    return CliExitCode.OperationFailed;
                }
            }

            if (!runStructural)
                continue;

            structuralFailures.AddRange(
                GoldenCohortDriftStructuralCheck.ValidateStructuralResults(item, runId, getRun.Results));
        }

        if (structuralFailures.Count > 0)
        {
            object report = new
            {
                success = false,
                kind = "goldenCohortDrift",
                strictReal = options.StrictReal,
                structuralOnly = options.StructuralOnly,
                structuralFailures
            };
            await Console.Out.WriteLineAsync(JsonSerializer.Serialize(report, ContractJson.CamelCaseIgnoreNullIndented));

            return CliExitCode.OperationFailed;
        }

        if (!CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(
                options.StructuralOnly
                    ? "OK — golden-cohort structural validation passed (SHA comparison skipped)."
                    : options.StrictReal
                        ? "OK — golden-cohort drift passed (SHA, categories, structural validation)."
                        : "OK — golden-cohort drift passed (SHA, categories).");
        }
        else
        {
            object ok = new
            {
                success = true,
                kind = "goldenCohortDrift",
                strictReal = options.StrictReal,
                structuralOnly = options.StructuralOnly,
                cohortPath = resolvedCohort
            };
            Console.WriteLine(JsonSerializer.Serialize(ok, ContractJson.CamelCaseIgnoreNullIndented));
        }

        return CliExitCode.Success;
    }
}
