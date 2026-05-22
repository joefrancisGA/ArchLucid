using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Agents.Evidence;

/// <inheritdoc cref="IAgentCuratedEvidenceProposer" />
public sealed class AgentCuratedEvidenceProposer(
    IAgentCompletionClient completionClient,
    IOptions<AgentCuratedEvidenceProposalOptions> options,
    ILogger<AgentCuratedEvidenceProposer> logger) : IAgentCuratedEvidenceProposer
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private const string SystemPrompt =
        "You review enterprise architecture agent output. " +
        "If the findings suggest a policy, pattern, or service catalog entry missing from the supplied evidence catalog " +
        "that would help future analyses, return ONE JSON object: " +
        "{\"type\":\"Policy\"|\"Pattern\"|\"Service\",\"title\":string,\"description\":string,\"rationale\":string}. " +
        "If nothing is missing, return null.";

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly AgentCuratedEvidenceProposalOptions _options =
        (options ?? throw new ArgumentNullException(nameof(options))).Value;

    private readonly ILogger<AgentCuratedEvidenceProposer> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<string?> TryProposeEvidenceJsonAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentResult result,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(result);

        if (!_options.Enabled)
            return null;

        string userPrompt = BuildUserPrompt(runId, request, evidence, result);

        try
        {
            string response = await _completionClient
                .CompleteJsonAsync(SystemPrompt, userPrompt, maxTokens: 512, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            return NormalizeResponse(response);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
                _logger.LogDebugCuratedEvidenceProposalSkipped(ex, runId, result.AgentType.ToString());

            return null;
        }
    }

    internal static string BuildUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentResult result)
    {
        string catalogSummary = JsonSerializer.Serialize(
            new
            {
                policies = evidence.Policies.Select(p => new { p.PolicyId, p.Title }).Take(20),
                patterns = evidence.Patterns.Select(p => new { p.PatternId, p.Name }).Take(20),
                services = evidence.ServiceCatalog.Select(s => new { s.ServiceId, s.ServiceName }).Take(20),
            },
            JsonOptions);

        string findingsSummary = JsonSerializer.Serialize(
            result.Findings.Select(f => new { Title = f.Message, f.Severity, f.Category }).Take(12),
            JsonOptions);

        return $"""
                RunId: {runId}
                System: {request.SystemName}
                AgentType: {result.AgentType}
                Claims: {string.Join("; ", result.Claims.Take(6))}
                EvidenceRefs: {string.Join(", ", result.EvidenceRefs.Take(12))}
                Findings: {findingsSummary}
                ExistingCatalog: {catalogSummary}
                """;
    }

    internal static string? NormalizeResponse(string response)
    {
        if (string.IsNullOrWhiteSpace(response))
            return null;

        string trimmed = response.Trim();

        if (trimmed.Equals("null", StringComparison.OrdinalIgnoreCase))
            return null;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(trimmed);
            JsonElement root = doc.RootElement;

            if (root.ValueKind == JsonValueKind.Null)
                return null;

            if (root.ValueKind != JsonValueKind.Object)
                return null;

            ProposedEvidencePayload? payload = JsonSerializer.Deserialize<ProposedEvidencePayload>(trimmed, JsonOptions);

            if (payload is null || string.IsNullOrWhiteSpace(payload.Title))
                return null;

            if (!IsSupportedType(payload.Type))
                return null;

            return JsonSerializer.Serialize(payload, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool IsSupportedType(string type) =>
        type.Equals("Policy", StringComparison.OrdinalIgnoreCase)
        || type.Equals("Pattern", StringComparison.OrdinalIgnoreCase)
        || type.Equals("Service", StringComparison.OrdinalIgnoreCase);
}
