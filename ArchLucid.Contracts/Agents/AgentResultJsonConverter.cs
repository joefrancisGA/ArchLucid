using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Deserializes <see cref="AgentResult" /> and merges structured claim-level <c>evidenceRefs</c> into
///     <see cref="AgentResult.EvidenceRefs" /> so eval-corpus objects do not drop linkage at parse time.
/// </summary>
public sealed class AgentResultJsonConverter : JsonConverter<AgentResult>
{
    public override AgentResult? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using JsonDocument document = JsonDocument.ParseValue(ref reader);
        JsonElement root = document.RootElement;

        AgentResultJsonPayload? payload = JsonSerializer.Deserialize<AgentResultJsonPayload>(root.GetRawText(), options);

        if (payload is null)
            return null;

        AgentResult result = payload.ToAgentResult();
        MergeClaimEvidenceRefs(root, result);

        return result;
    }

    public override void Write(Utf8JsonWriter writer, AgentResult value, JsonSerializerOptions options) =>
        JsonSerializer.Serialize(writer, AgentResultJsonPayload.FromAgentResult(value), options);

    internal static void MergeClaimEvidenceRefs(JsonElement root, AgentResult result)
    {
        if (!TryGetPropertyIgnoreCase(root, "claims", out JsonElement claims) || claims.ValueKind != JsonValueKind.Array)
            return;

        List<string> merged = new(result.EvidenceRefs);

        foreach (JsonElement claim in claims.EnumerateArray())
        {
            if (claim.ValueKind != JsonValueKind.Object)
                continue;

            if (!TryGetPropertyIgnoreCase(claim, "evidenceRefs", out JsonElement refs) || refs.ValueKind != JsonValueKind.Array)
                continue;

            foreach (JsonElement reference in refs.EnumerateArray())
            {
                string? value = ReadEvidenceRef(reference);

                if (string.IsNullOrWhiteSpace(value))
                    continue;

                string trimmed = value.Trim();

                if (!merged.Contains(trimmed, StringComparer.OrdinalIgnoreCase))
                    merged.Add(trimmed);
            }
        }

        result.EvidenceRefs = merged;
    }

    private static string? ReadEvidenceRef(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.String)
            return item.GetString();

        if (item.ValueKind != JsonValueKind.Object)
            return null;

        if (TryGetPropertyIgnoreCase(item, "id", out JsonElement id) && id.ValueKind == JsonValueKind.String)
            return id.GetString();

        return null;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;
            return true;
        }

        value = default;
        return false;
    }

    /// <summary>
    ///     Payload shape for <see cref="AgentResult" /> without the type-level converter (avoids deserialize recursion).
    /// </summary>
    private sealed class AgentResultJsonPayload
    {
        public string ResultId { get; set; } = Guid.NewGuid().ToString("N");

        public string TaskId { get; set; } = string.Empty;

        public string RunId { get; set; } = string.Empty;

        public AgentType AgentType { get; set; }

        [JsonConverter(typeof(AgentResultClaimListJsonConverter))]
        public List<string> Claims { get; set; } = [];

        public List<string> EvidenceRefs { get; set; } = [];

        public double Confidence { get; set; }

        public double? CalibratedConfidence { get; set; }

        public List<ArchitectureFinding> Findings { get; set; } = [];

        public List<ArchitectureFinding> ChecklistCoverage { get; set; } = [];

        public List<WithheldFindingSummary> WithheldFindings { get; set; } = [];

        public InsightDensityCurationSummary? InsightDensityCuration { get; set; }

        [JsonConverter(typeof(AgentTopologyProposalJsonConverter))]
        public AgentTopologyProposal? ProposedChanges { get; set; }

        public string? ReasoningTrace { get; set; }

        public IEnumerable<Citation>? Citations { get; set; }

        public DateTime CreatedUtc { get; set; } = TimeProvider.System.GetUtcNow().UtcDateTime;

        public AgentResultRetrievalGroundingTrace? RetrievalGroundingTrace { get; set; }

        public string? DegradationReasonCode { get; set; }

        public StructuralExecutionMode? TaskStructuralExecutionMode { get; set; }

        public bool CacheServed { get; set; }

        public Dictionary<string, string>? UpstreamResultFingerprints { get; set; }

        public AgentResult ToAgentResult() =>
            new()
            {
                ResultId = ResultId,
                TaskId = TaskId,
                RunId = RunId,
                AgentType = AgentType,
                Claims = Claims,
                EvidenceRefs = EvidenceRefs,
                Confidence = Confidence,
                CalibratedConfidence = CalibratedConfidence,
                Findings = Findings,
                ChecklistCoverage = ChecklistCoverage,
                WithheldFindings = WithheldFindings,
                InsightDensityCuration = InsightDensityCuration,
                ProposedChanges = ProposedChanges,
                ReasoningTrace = ReasoningTrace,
                Citations = Citations,
                CreatedUtc = CreatedUtc,
                RetrievalGroundingTrace = RetrievalGroundingTrace,
                DegradationReasonCode = DegradationReasonCode,
                TaskStructuralExecutionMode = TaskStructuralExecutionMode,
                CacheServed = CacheServed,
                UpstreamResultFingerprints = UpstreamResultFingerprints,
            };

        public static AgentResultJsonPayload FromAgentResult(AgentResult value) =>
            new()
            {
                ResultId = value.ResultId,
                TaskId = value.TaskId,
                RunId = value.RunId,
                AgentType = value.AgentType,
                Claims = value.Claims,
                EvidenceRefs = value.EvidenceRefs,
                Confidence = value.Confidence,
                CalibratedConfidence = value.CalibratedConfidence,
                Findings = value.Findings,
                ChecklistCoverage = value.ChecklistCoverage,
                WithheldFindings = value.WithheldFindings,
                InsightDensityCuration = value.InsightDensityCuration,
                ProposedChanges = value.ProposedChanges,
                ReasoningTrace = value.ReasoningTrace,
                Citations = value.Citations,
                CreatedUtc = value.CreatedUtc,
                RetrievalGroundingTrace = value.RetrievalGroundingTrace,
                DegradationReasonCode = value.DegradationReasonCode,
                TaskStructuralExecutionMode = value.TaskStructuralExecutionMode,
                CacheServed = value.CacheServed,
                UpstreamResultFingerprints = value.UpstreamResultFingerprints,
            };
    }
}
