using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime.Evaluation;

public sealed partial class AgentOutputLlmSemanticJudge
{
    private async Task<AgentOutputLlmJudgeParsedResult?> TryInvokeJudgeSampleAsync(
        AgentOutputLlmSemanticJudgeOptions judgeOpts,
        string traceId,
        string parsedResultJson,
        AgentType agentType,
        CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();

        IAgentCompletionClient client;

        try
        {
            client = scope.ServiceProvider.GetRequiredKeyedService<IAgentCompletionClient>(
                AgentOutputLlmJudgeCompletionServiceKey.Value);
        }
        catch (InvalidOperationException ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(
                    ex,
                    "LLM semantic judge completion client is unavailable (missing registration or Azure OpenAI settings) for TraceId={TraceId}",
                    traceId);

            return null;
        }

        string userPayload = TrimForJudge(parsedResultJson, judgeOpts.MaxInputCharacters);
        string systemPrompt = BuildSystemPrompt(agentType);
        string userPrompt = "traceId:" + traceId + "\nagentJson:\n" + userPayload;

        return await InvokeJudgeSampleAsync(
                client,
                judgeOpts,
                traceId,
                agentType,
                systemPrompt,
                userPrompt,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<AgentOutputLlmJudgeParsedResult?> InvokeJudgeSampleAsync(
        IAgentCompletionClient client,
        AgentOutputLlmSemanticJudgeOptions judgeOpts,
        string traceId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken)
    {
        using CancellationTokenSource linked =
            CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        linked.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, judgeOpts.TimeoutSeconds)));

        try
        {
            using (LlmAccountingInvocationScope.Begin(agentType, LlmInvokeKind.SemanticJudge))
            {
                string raw = await client.CompleteJsonAsync(
                        systemPrompt,
                        userPrompt,
                        maxTokens: null,
                        cancellationToken: linked.Token)
                    .ConfigureAwait(false);

                return TryParseJudgeResponse(raw);
            }
        }
        catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "LLM semantic judge timed out for TraceId={TraceId}", traceId);

            return null;
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "LLM semantic judge failed for TraceId={TraceId}", traceId);

            return null;
        }
    }

    private static double MedianOfDoubles(IReadOnlyList<double> values)
    {
        List<double> sorted = values.OrderBy(static x => x).ToList();

        int mid = sorted.Count / 2;

        return sorted.Count % 2 == 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2.0;
    }

    private static double PopulationStdDev(List<double> values)
    {
        if (values.Count < 2)
            return 0.0;

        double mean = values.Average();
        double sq = values.Sum(v =>
        {
            double d = v - mean;

            return d * d;
        });

        return Math.Sqrt(sq / values.Count);
    }

    private static string TrimForJudge(string json, int maxChars)
    {
        maxChars = Math.Max(4096, maxChars);

        if (json.Length <= maxChars)
            return json;

        return json.Substring(0, maxChars) +
               "\n…truncated_total_chars=" +
               json.Length.ToString(CultureInfo.InvariantCulture);
    }

    private static string BuildSystemPrompt(AgentType agentType)
    {
        string roleHint = agentType switch
        {
            AgentType.Topology =>
                "This agent proposes topology/service relationships — penalize hand-wavy claims without evidence references and diagrams that contradict stated relationships.",
            AgentType.Critic =>
                "This agent challenges other agents' proposals — reward constructive challenge grounded in the JSON; penalize empty pushback or claims without evidence.",
            AgentType.Cost =>
                "This agent estimates cost and FinOps impact — penalize dollar figures, SKU counts, or savings claims without evidenceRefs; reward conservative ranges tied to cited inputs.",
            AgentType.Compliance =>
                "This agent maps regulatory and control posture — penalize control IDs, framework assertions, or risk ratings without evidenceRefs; reward precise citations to supplied evidence.",
            _ => "Agent role: " + agentType + "."
        };

        return "You are a strict output-quality rater for enterprise architecture review JSON (AgentResult).\n"
               + "Given one JSON object, rate how well it is internally consistent and evidence-backed.\n"
               + "Penalize uncited claims (no evidenceRefs and no evidence string), vague or empty findings, and "
               + "obvious internal contradictions.\n"
               + "Do not invent facts from outside the JSON.\n"
               + roleHint +
               "\nReturn a single JSON object with keys: overallQuality (number 0..1), rationale (short string, "
               + "max 400 chars, plain text).";
    }

    private static AgentOutputLlmJudgeParsedResult? TryParseJudgeResponse(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(raw.Trim());

            JsonElement root = doc.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
                return null;

            double q = ReadQuality(root);

            if (double.IsNaN(q) || double.IsInfinity(q))
                return null;

            q = Math.Clamp(q, 0.0, 1.0);
            string? rationale = ReadRationale(root);

            return new AgentOutputLlmJudgeParsedResult(q, rationale);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static double ReadQuality(JsonElement root)
    {
        if (root.TryGetProperty("overallQuality", out JsonElement named) && TryGetDouble(named, out double v1))
            return v1;

        if (root.TryGetProperty("overall_quality", out JsonElement snake) && TryGetDouble(snake, out double v2))
            return v2;

        return double.NaN;
    }

    private static bool TryGetDouble(JsonElement e, out double value)
    {
        if (e.ValueKind == JsonValueKind.Number && e.TryGetDouble(out value))
            return true;

        if (e.ValueKind == JsonValueKind.String && double.TryParse(e.GetString(), CultureInfo.InvariantCulture, out value))
            return true;

        value = double.NaN;

        return false;
    }

    private static string? ReadRationale(JsonElement root)
    {
        if (!root.TryGetProperty("rationale", out JsonElement r) || r.ValueKind != JsonValueKind.String)
            return null;

        string? s = r.GetString();

        if (string.IsNullOrWhiteSpace(s))
            return null;

        string t = s.Trim();

        return t.Length <= 400 ? t : t[..400];
    }
}
