using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>LP-04: populates <see cref="AgentOutputSemanticScore.FindingCitationCoverageRatio" /> for Real tasks only.</summary>
internal static class AgentOutputTraceFindingCitationCoverageApplicator
{
    private static readonly IFindingClaimCoverageEvaluator CoverageEvaluator =
        new FindingClaimCoverageEvaluator(NullLogger<FindingClaimCoverageEvaluator>.Instance);

    private static readonly JsonSerializerOptions FindingJsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters =
        {
            new ArchitectureFindingJsonConverter(),
            new JsonStringEnumConverter(),
        },
    };

    internal static void Apply(
        AgentOutputSemanticScore semanticScore,
        string? parsedResultJson,
        StructuralExecutionMode? taskStructuralExecutionMode,
        string? hostAgentExecutionMode)
    {
        ArgumentNullException.ThrowIfNull(semanticScore);

        if (!ShouldEvaluateFindingCitationCoverage(taskStructuralExecutionMode, hostAgentExecutionMode))
            return;

        IReadOnlyList<ArchitectureFinding> findings = TryParseFindings(parsedResultJson);

        if (findings.Count == 0)
            return;

        FindingClaimCoverageReport report = CoverageEvaluator.Evaluate(findings);
        semanticScore.FindingCitationCoverageRatio = report.CoverageRatio;
    }

    internal static bool ShouldEvaluateFindingCitationCoverage(
        StructuralExecutionMode? taskStructuralExecutionMode,
        string? hostAgentExecutionMode)
    {
        if (taskStructuralExecutionMode == StructuralExecutionMode.Simulator
            || taskStructuralExecutionMode == StructuralExecutionMode.Fallback)
        {
            return false;
        }

        if (taskStructuralExecutionMode == StructuralExecutionMode.Real
            || taskStructuralExecutionMode == StructuralExecutionMode.Mixed)
        {
            return true;
        }

        return string.Equals(hostAgentExecutionMode, "Real", StringComparison.OrdinalIgnoreCase);
    }

    private static List<ArchitectureFinding> TryParseFindings(string? parsedResultJson)
    {
        if (string.IsNullOrWhiteSpace(parsedResultJson))
            return [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(parsedResultJson);

            if (document.RootElement.ValueKind != JsonValueKind.Object
                || !document.RootElement.TryGetProperty("findings", out JsonElement findingsElement)
                || findingsElement.ValueKind != JsonValueKind.Array)
            {
                return [];
            }

            List<ArchitectureFinding>? findings =
                JsonSerializer.Deserialize<List<ArchitectureFinding>>(findingsElement.GetRawText(), FindingJsonOptions);

            return findings ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
