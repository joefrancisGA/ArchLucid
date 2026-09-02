using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
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
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        bool strictReal = false;
        bool structuralOnly = false;
        string? cohortPath = null;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--strict-real", StringComparison.Ordinal))
            {
                strictReal = true;

                continue;
            }

            if (string.Equals(token, "--structural-only", StringComparison.Ordinal))
            {
                structuralOnly = true;

                continue;
            }

            if (string.Equals(token, "--cohort", StringComparison.Ordinal))
            {
                if (i + 1 >= args.Length)
                {
                    await Console.Error.WriteLineAsync("Missing value for --cohort.");

                    return CliExitCode.UsageError;
                }

                cohortPath = args[++i].Trim();

                continue;
            }

            await Console.Error.WriteLineAsync($"Unexpected argument: {token}");

            return CliExitCode.UsageError;
        }

        if (strictReal && !GoldenCohortDriftParser.IsRealLlmContext())
        {
            await Console.Error.WriteLineAsync(
                "Refusing --strict-real: set ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true and/or " +
                "ARCHLUCID_AGENT_EXECUTION_MODE/AgentExecution__Mode=Real so the gate targets a real-LLM API host.");

            return CliExitCode.UsageError;
        }

        string? repoRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();
        string resolvedCohort = string.IsNullOrWhiteSpace(cohortPath)
            ? Path.Combine(repoRoot ?? Directory.GetCurrentDirectory(), "tests", "golden-cohort", "cohort.json")
            : Path.GetFullPath(cohortPath);

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

        bool runStructural = strictReal || structuralOnly;
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

            if (!structuralOnly)
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

                string actualShaLower = fingerprint.Sha256HexUpper.ToLowerInvariant();
                string expectedSha = item.ExpectedCommittedManifestSha256.Trim();

                if (!string.Equals(actualShaLower, expectedSha, StringComparison.OrdinalIgnoreCase))
                {
                    await Console.Error.WriteLineAsync(
                        $"[{item.Id}] committed manifest SHA mismatch. expected={expectedSha} actual={actualShaLower}");

                    return CliExitCode.OperationFailed;
                }
            }

            ArchLucidApiClient.GetRunResult? getRun = await client.GetRunAsync(runId);

            if (getRun is null)
            {
                await Console.Error.WriteLineAsync($"[{item.Id}] get run failed.");

                return CliExitCode.OperationFailed;
            }

            if (strictReal)
            {
                if (getRun.Run.RealModeFellBackToSimulator is true)
                {
                    GoldenCohortDriftStructuralFailure fb = new()
                    {
                        CohortItemId = item.Id,
                        RunId = runId,
                        Code = "realModeFellBackToSimulator",
                        Message =
                            "Run recorded RealModeFellBackToSimulator=true; strict-real cannot validate real-LLM JSON shape."
                    };
                    structuralFailures.Add(fb);
                    await Console.Out.WriteLineAsync(
                        JsonSerializer.Serialize(new { success = false, failure = fb }, ContractJson.CamelCaseIgnoreNullIndented));

                    return CliExitCode.OperationFailed;
                }
            }

            List<AgentResult>? agentResults = GoldenCohortDriftParser.TryParseAgentResults(getRun.Results, item.Id, out string? parseError);

            if (parseError is not null)
            {
                await Console.Error.WriteLineAsync(parseError);

                return CliExitCode.OperationFailed;
            }

            if (agentResults is null)
                return CliExitCode.OperationFailed;

            if (!structuralOnly)
            {
                if (!GoldenCohortDriftParser.CategoriesMatch(item, agentResults))
                {
                    SortedSet<string> actualCategories =
                        GoldenCohortFindingCategoryAggregator.DistinctCategories(agentResults);
                    SortedSet<string> expectedCategories = new(StringComparer.Ordinal);

                    foreach (string c in item.ExpectedFindingCategories.Where(c => !string.IsNullOrWhiteSpace(c)))
                        expectedCategories.Add(c.Trim());

                    await Console.Error.WriteLineAsync(
                        $"[{item.Id}] finding category multiset mismatch. expected={string.Join(", ", expectedCategories)} " +
                        $"actual={string.Join(", ", actualCategories)}");

                    return CliExitCode.OperationFailed;
                }
            }

            if (!runStructural)
                continue;

            structuralFailures.AddRange(GoldenCohortDriftParser.ValidateStructuralResults(item, runId, getRun.Results));
        }

        if (structuralFailures.Count > 0)
        {
            object report = new
            {
                success = false,
                kind = "goldenCohortDrift",
                strictReal,
                structuralOnly,
                structuralFailures
            };
            await Console.Out.WriteLineAsync(JsonSerializer.Serialize(report, ContractJson.CamelCaseIgnoreNullIndented));

            return CliExitCode.OperationFailed;
        }

        if (!CliExecutionContext.JsonOutput)
        {
            Console.WriteLine(
                structuralOnly
                    ? "OK — golden-cohort structural validation passed (SHA comparison skipped)."
                    : strictReal
                        ? "OK — golden-cohort drift passed (SHA, categories, structural validation)."
                        : "OK — golden-cohort drift passed (SHA, categories).");
        }
        else
        {
            object ok = new
            {
                success = true,
                kind = "goldenCohortDrift",
                strictReal,
                structuralOnly,
                cohortPath = resolvedCohort
            };
            Console.WriteLine(JsonSerializer.Serialize(ok, ContractJson.CamelCaseIgnoreNullIndented));
        }

        return CliExitCode.Success;
    }

    public sealed class GoldenCohortDriftStructuralFailure
    {
        public string? Code
        {
            get;
            set;
        }

        public string? Message
        {
            get;
            set;
        }

        public string? CohortItemId
        {
            get;
            set;
        }

        public string? RunId
        {
            get;
            set;
        }

        public string? AgentType
        {
            get;
            set;
        }

        public string? ResultId
        {
            get;
            set;
        }

        public RealLlmStructuralValidationResult? Validation
        {
            get;
            set;
        }
    }
}
