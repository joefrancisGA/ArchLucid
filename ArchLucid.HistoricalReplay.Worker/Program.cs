using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.Replay.Historical;
using ArchLucid.Application.Replay.Historical.Execution;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using static ArchLucid.Application.Replay.Historical.Execution.RecordedReplayRecipe;

JsonSerializerOptions inputOptions = new() { MaxDepth = 32, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };
JsonSerializerOptions payloadOptions = new(JsonSerializerDefaults.Web)
{
    MaxDepth = 32,
    UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    PropertyNameCaseInsensitive = false,
};

try
{
    using var bytes = new MemoryStream();
    var stdin = Console.OpenStandardInput();
    byte[] chunk = new byte[8192];
    int read;
    while ((read = await stdin.ReadAsync(chunk)) != 0)
    {
        if (bytes.Length + read > MaxWorkerInputBytes)
            return 2;
        bytes.Write(chunk, 0, read);
    }
    var input = JsonSerializer.Deserialize<RecordedReplayWorkerInput>(bytes.GetBuffer().AsSpan(0, (int)bytes.Length), inputOptions);
    if (input?.Run is null || input.Inputs is null || input.RecordedUtc == default || input.Run.RunId == Guid.Empty)
        return 2;
    var output = input.Run.Product switch
    {
        HistoricalReplayProduct.ArchLucid => ReplayAuthority(input),
        HistoricalReplayProduct.SecureNow => ReplaySecureNow(input),
        _ => throw new InvalidDataException(),
    };
    byte[] encoded = JsonSerializer.SerializeToUtf8Bytes(output, inputOptions);
    if (encoded.Length > MaxWorkerOutputBytes)
        return 2;
    await Console.OpenStandardOutput().WriteAsync(encoded);
    return 0;
}
catch (Exception exception) when (exception is JsonException or InvalidOperationException or ArgumentException
    or InvalidDataException or IOException or NotSupportedException or KeyNotFoundException)
{
    // No raw case data or parser exception details cross the sandbox boundary.
    return 2;
}

T Read<T>(RecordedReplayWorkerInput input, string key) where T : class =>
    JsonSerializer.Deserialize<T>(input.Inputs[key], payloadOptions) ?? throw new InvalidDataException();

RecordedReplayWorkerOutput ReplayAuthority(RecordedReplayWorkerInput input)
{
    bool hasTool = input.Inputs.ContainsKey("tool");
    if (input.Mode is not (HistoricalReplayMode.RecordedTyped or HistoricalReplayMode.RecordedRaw)
        || input.Inputs.Count != (input.Mode == HistoricalReplayMode.RecordedRaw ? 5 : 4) + (hasTool ? 1 : 0))
        throw new InvalidDataException();

    var config = Read<AuthorityConfig>(input, "configuration");
    var policy = Read<AuthorityPolicyPins>(input, "policy");
    var evidence = Read<AuthorityEvidencePins>(input, "evidence");
    if (string.IsNullOrWhiteSpace(config.TaskId) || !Enum.IsDefined(config.AgentType) || !policy.EnforceAgentSchema.HasValue
        || evidence.References is null || evidence.References.Any(string.IsNullOrWhiteSpace))
        throw new InvalidDataException();

    // Materialize the normalized typed contract with the existing converters and identity checks. This does not
    // validate or make any claim about the original provider payload.
    var typed = ReadAgent("typed", new AgentResultParser());

    AgentResult accepted = typed;
    if (input.Mode == HistoricalReplayMode.RecordedRaw)
    {
        var parser = new AgentResultParser(
            new SchemaValidationService(NullLogger<SchemaValidationService>.Instance,
                Options.Create(new SchemaValidationOptions { EnableDetailedErrors = false })),
            Options.Create(new AgentResultSchemaValidationOptions { EnforceOnParse = policy.EnforceAgentSchema.Value }),
            NullLogger<AgentResultParser>.Instance);
        accepted = ReadAgent("raw", parser);
    }

    var evidenceRefs = evidence.References.ToHashSet(StringComparer.Ordinal);
    Dictionary<string, JsonElement> stages = new(StringComparer.Ordinal);
    if (hasTool)
    {
        var tool = Read<AuthorityEvidencePins>(input, "tool");
        if (tool.References is null || tool.References.Any(string.IsNullOrWhiteSpace))
            throw new InvalidDataException();
        var toolReferences = tool.References.Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray();
        stages[ToolStage] = JsonSerializer.SerializeToElement(new { references = toolReferences }, payloadOptions);
        evidenceRefs.UnionWith(toolReferences);
    }

    var stage = JsonSerializer.SerializeToElement(new
    {
        accepted.ResultId, accepted.RunId, accepted.TaskId, agentType = accepted.AgentType.ToString(),
        accepted.Claims, accepted.EvidenceRefs, accepted.Confidence,
    }, payloadOptions);
    string[] References(bool resolved) => accepted.EvidenceRefs.Where(reference => evidenceRefs.Contains(reference) == resolved)
        .Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray();
    var final = JsonSerializer.SerializeToElement(new
    {
        input.RecordedUtc, accepted.ResultId, accepted.Claims, accepted.Confidence,
        resolvedEvidence = References(true), unresolvedEvidence = References(false),
    }, payloadOptions);
    stages.Add(AgentStage, stage);
    stages.Add(AuthorityStage, final);
    return new(stages, final);

    AgentResult ReadAgent(string key, AgentResultParser parser)
    {
        var bytes = input.Inputs[key];
        using var document = JsonDocument.Parse(bytes, new JsonDocumentOptions { MaxDepth = 32 });
        if (!document.RootElement.TryGetProperty("resultId", out var resultId) || resultId.ValueKind != JsonValueKind.String
            || string.IsNullOrWhiteSpace(resultId.GetString()))
            throw new InvalidDataException();
        var value = parser.ParseAndValidate(new UTF8Encoding(false, true).GetString(bytes),
            input.Run.RunId.ToString("D"), config.TaskId, config.AgentType);
        if (!string.Equals(resultId.GetString(), value.ResultId, StringComparison.Ordinal)
            || !double.IsFinite(value.Confidence) || value.EvidenceRefs.Any(string.IsNullOrWhiteSpace))
            throw new InvalidDataException();
        return value;
    }
}

RecordedReplayWorkerOutput ReplaySecureNow(RecordedReplayWorkerInput input)
{
    if (input.Mode != HistoricalReplayMode.RecordedTyped || input.Inputs.Count != 3)
        throw new InvalidDataException();

    var snapshot = Read<AzureInventorySnapshotDetailReadModel>(input, "evidence");
    var policy = Read<SecureNowPolicyPins>(input, "policy");
    var config = Read<SecureNowConfig>(input, "configuration");
    if (policy.MaximumCaptureAgeHours is not (> 0 and <= 8760) || string.IsNullOrWhiteSpace(config.Target)
        || snapshot.Header is not { CapturedUtc: { } captured } header || header.SnapshotId != input.Run.SnapshotId
        || !input.Run.Scope.Matches(header.TenantId, header.WorkspaceId, header.ProjectId)
        || header.ContentHashSha256 is not { Length: 32 }
        || !Convert.ToHexString(header.ContentHashSha256).Equals(input.SourceCommitmentSha256, StringComparison.OrdinalIgnoreCase)
        || header.CaptureStatus != AzureInventoryCaptureStatus.Succeeded
        || header.CompletenessScore != 1m || header.WarningCount != 0 || header.ErrorCount != 0)
        throw new InvalidDataException();

    var captureUtc = new DateTimeOffset(DateTime.SpecifyKind(captured, DateTimeKind.Utc));
    if (captureUtc > input.RecordedUtc || input.RecordedUtc - captureUtc > TimeSpan.FromHours(policy.MaximumCaptureAgeHours.Value))
        throw new InvalidDataException();

    if (snapshot.Resources.Any(row => row.TenantId != header.TenantId || row.SnapshotId != header.SnapshotId))
        throw new InvalidDataException();
    var graph = InventoryReachabilityPathGraph.Build(snapshot);
    if (!graph.ResourcesByArmId.TryGetValue(config.Target, out var resource))
        throw new InvalidDataException();
    var edges = graph.OutgoingEdges.GetValueOrDefault(SecureNowArchitectConstants.InternetPublicExposureNodeId) ?? [];
    var hops = edges.Where(edge => string.Equals(edge.ToNodeId, resource.AzureResourceId, StringComparison.OrdinalIgnoreCase))
        .OrderBy(edge => edge.ToNodeId, StringComparer.Ordinal).ThenBy(edge => edge.EdgeType, StringComparer.Ordinal)
        .ThenBy(edge => edge.ProvenanceKind).ThenBy(edge => edge.InferenceSource, StringComparer.Ordinal)
        .Select(edge => new { edge.FromNodeId, edge.ToNodeId, edge.EdgeType, provenance = edge.ProvenanceKind.ToString(), edge.InferenceSource })
        .ToArray();

    var final = JsonSerializer.SerializeToElement(new
    {
        header.SnapshotId, input.Run.FindingId, captureUtc, input.RecordedUtc, target = resource.AzureResourceId,
        directExposureEvidence = hops.Length > 0 ? "present" : "not-observed-in-this-projection", hops,
    }, payloadOptions);
    return new(new Dictionary<string, JsonElement>(StringComparer.Ordinal) { [SecureNowStage] = final }, final);
}

internal sealed record AuthorityConfig(string TaskId, AgentType AgentType);
internal sealed record AuthorityPolicyPins(bool? EnforceAgentSchema);
internal sealed record AuthorityEvidencePins(string[] References);
internal sealed record SecureNowPolicyPins(int? MaximumCaptureAgeHours);
internal sealed record SecureNowConfig(string Target);
