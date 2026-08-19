using ArchLucid.Cli.Diagnostics;
using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

internal static class PilotPreflightLocalSteps
{
    internal static IReadOnlyList<PilotPreflightStepResult> Evaluate(
        IConfiguration configuration,
        bool simulateProduction = false)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        List<PilotPreflightStepResult> steps = [];
        string contentRoot = Directory.GetCurrentDirectory();
        bool appsettingsExists = File.Exists(Path.Combine(contentRoot, "appsettings.json"))
                                 || File.Exists(Path.Combine(contentRoot, "archlucid.json"));

        IReadOnlyList<ValidateConfigFinding> findings =
            ValidateConfigEvaluator.Evaluate(configuration, contentRoot, appsettingsExists);

        foreach (ValidateConfigFinding finding in findings)
        {
            if (finding.Severity == ValidateConfigFindingSeverity.Info)
                continue;

            PilotPreflightDisposition disposition = finding.Severity switch
            {
                ValidateConfigFindingSeverity.Error => PilotPreflightDisposition.Block,
                ValidateConfigFindingSeverity.Warning => PilotPreflightDisposition.Warn,
                _ => PilotPreflightDisposition.Pass,
            };

            steps.Add(new PilotPreflightStepResult
            {
                Name = $"config:{finding.Category}:{finding.Check}",
                Disposition = disposition,
                Detail = finding.Detail,
                Remediation = disposition == PilotPreflightDisposition.Block
                    ? "Fix the configuration key in appsettings or environment variables — see docs/library/CONFIGURATION_REFERENCE.md."
                    : null,
            });
        }

        steps.Add(EvaluateAuthMode(configuration));
        steps.AddRange(PilotPreflightProductionLikeAuthSteps.Evaluate(configuration, contentRoot, simulateProduction));
        steps.Add(EvaluateExecutionMode(configuration));
        steps.Add(EvaluateAzureAiSearchExtractorConfig(configuration));
        steps.Add(EvaluateProofPacketPrerequisites());

        return steps;
    }

    internal static IConfiguration LoadLocalConfiguration(bool simulateProduction = false)
    {
        if (!simulateProduction)
            return DoctorLocalConfiguration.CreateForDoctor();

        return new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("archlucid.json", optional: true, reloadOnChange: false)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddInMemoryCollection(
                new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
                {
                    ["ASPNETCORE_ENVIRONMENT"] = Microsoft.Extensions.Hosting.Environments.Production,
                })
            .AddEnvironmentVariables()
            .Build();
    }

    private static PilotPreflightStepResult EvaluateAuthMode(IConfiguration configuration)
    {
        string? mode = configuration["ArchLucidAuth:Mode"]?.Trim();

        if (string.IsNullOrWhiteSpace(mode))
        {
            return new PilotPreflightStepResult
            {
                Name = "config:ArchLucidAuth:Mode",
                Disposition = PilotPreflightDisposition.Block,
                Detail = "ArchLucidAuth:Mode is unset — first pilot requires an explicit auth mode.",
                Remediation = "Set ArchLucidAuth:Mode (DevelopmentBypass locally only, ApiKey, JwtBearer, or Entra).",
            };
        }

        return new PilotPreflightStepResult
        {
            Name = "config:ArchLucidAuth:Mode",
            Disposition = PilotPreflightDisposition.Pass,
            Detail = mode,
        };
    }

    /// <summary>
    ///     Reports AgentExecution:Mode as a dedicated preflight row so operators can confirm
    ///     whether the host is wired for Simulator or Real LLM execution before first review.
    /// </summary>
    private static PilotPreflightStepResult EvaluateExecutionMode(IConfiguration configuration)
    {
        string mode = configuration["AgentExecution:Mode"]?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(mode))
        {
            return new PilotPreflightStepResult
            {
                Name = "execution-mode",
                Disposition = PilotPreflightDisposition.Warn,
                Detail = "AgentExecution:Mode unset — host will use its compiled default (Simulator).",
                Remediation = "Set AgentExecution:Mode to Simulator or Real in appsettings / environment.",
            };
        }

        bool isReal = string.Equals(mode, "Real", StringComparison.OrdinalIgnoreCase);
        string detail = isReal
            ? $"Real — Azure OpenAI will be called during reviews. Confirm endpoint + key."
            : $"{mode} — no live LLM calls; suitable for demo/sandbox pilots.";

        return new PilotPreflightStepResult
        {
            Name = "execution-mode",
            Disposition = PilotPreflightDisposition.Pass,
            Detail = detail,
        };
    }

    /// <summary>
    ///     Checks whether Azure AI Search is configured per the production-like retrieval policy,
    ///     and surfaces the upload-limits docs pointer for operators who need to push extractor ZIPs.
    /// </summary>
    private static PilotPreflightStepResult EvaluateAzureAiSearchExtractorConfig(IConfiguration configuration)
    {
        string vectorIndex = configuration[AzureAiSearchProductionLikeConfigurationLint.RetrievalVectorIndexKey]?.Trim()
                             ?? "InMemory";

        string? endpoint = configuration[AzureAiSearchProductionLikeConfigurationLint.RetrievalAzureSearchEndpointKey]?.Trim();

        if (string.Equals(vectorIndex, AzureAiSearchProductionLikeConfigurationLint.RequiredVectorIndexMode, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(endpoint))
        {
            return new PilotPreflightStepResult
            {
                Name = "azure-ai-search",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = $"Retrieval:VectorIndex={vectorIndex}, endpoint configured. "
                         + "Upload-limit docs: docs/library/CONFIGURATION_REFERENCE.md §Extractor.",
            };
        }

        return new PilotPreflightStepResult
        {
            Name = "azure-ai-search",
            Disposition = PilotPreflightDisposition.Warn,
            Detail = $"Retrieval:VectorIndex={vectorIndex}; endpoint={(string.IsNullOrWhiteSpace(endpoint) ? "unset" : "set")}. "
                     + "InMemory index is not supported for production-like pilots.",
            Remediation = "Set Retrieval:VectorIndex=AzureSearch and Retrieval:AzureSearch:Endpoint. "
                          + "See docs/library/CONFIGURATION_REFERENCE.md §Extractor for upload limits.",
        };
    }

    /// <summary>
    ///     Verifies that the claim-lint rules file shipped with the CLI is present in the execution
    ///     directory, which is a prerequisite for <c>archlucid pilot proof-packet</c>.
    /// </summary>
    private static PilotPreflightStepResult EvaluateProofPacketPrerequisites()
    {
        string assemblyDir = AppContext.BaseDirectory;
        string rulesFile = Path.Combine(assemblyDir, "Data", "proof_packet_claim_lint_rules.v1.json");

        if (File.Exists(rulesFile))
        {
            return new PilotPreflightStepResult
            {
                Name = "proof-packet-prereq:claim-lint-rules",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = "Claim-lint rules file present — proof-packet generation is ready.",
            };
        }

        return new PilotPreflightStepResult
        {
            Name = "proof-packet-prereq:claim-lint-rules",
            Disposition = PilotPreflightDisposition.Warn,
            Detail = $"proof_packet_claim_lint_rules.v1.json not found at {rulesFile}.",
            Remediation = "Reinstall or rebuild the CLI to restore the bundled claim-lint rules file.",
        };
    }
}
