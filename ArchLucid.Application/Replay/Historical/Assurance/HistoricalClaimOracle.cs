using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.InfraEvidence;

using static ArchLucid.Application.Replay.Historical.Execution.RecordedReplayRecipe;

namespace ArchLucid.Application.Replay.Historical.Assurance;

/// <summary>The v1 oracle reads preserved observations, not the decision engine, graph, replay outputs or AI services.</summary>
internal static class HistoricalClaimOracle
{
    internal const string AuthorityObservationSchema = "authority-control-observations-v1";
    internal const string AuthorityRule = "authority-control-state-v1";
    internal const string SecureNowRule = "securenow-observed-public-network-setting-v1";
    private static readonly JsonSerializerOptions Web = new(JsonSerializerDefaults.Web)
    {
        MaxDepth = 32,
        PropertyNameCaseInsensitive = false,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    internal static async Task<HistoricalClaimReview> EvaluateAsync(HistoricalReplayDescriptor descriptor, HistoricalClaimInputs evidence,
        int claimIndex, CancellationToken ct)
    {
        var product = descriptor.Source.Run.Product;
        var rule = product == HistoricalReplayProduct.ArchLucid ? AuthorityRule : SecureNowRule;
        HistoricalClaimReview Indeterminate(string reason) =>
            new(HistoricalClaimVerdict.Indeterminate, reason, rule, claimIndex, evidence.Verified);
        try
        {
            var schema = product == HistoricalReplayProduct.ArchLucid ? AuthorityOutput : SecureNowOutput;
            if (descriptor.Versions is not { CanonicalizationVersion: Canonicalization } versions || versions.OutputSchema != schema)
                return Indeterminate("unsupported_historical_projection");
            var original = await evidence.GetAsync(HistoricalArtifactRole.OriginalOutput, schema);
            if (original is null)
                return Indeterminate("sealed_claim_unavailable");
            using var claim = Parse(original);
            var (verdict, reason) = product switch
            {
                HistoricalReplayProduct.ArchLucid => await EvaluateAuthorityAsync(descriptor, claim.RootElement, evidence, claimIndex, ct),
                HistoricalReplayProduct.SecureNow => await EvaluateSecureNowAsync(descriptor, claim.RootElement, evidence, claimIndex, ct),
                _ => Unknown("unsupported_product"),
            };
            ct.ThrowIfCancellationRequested();
            return new(verdict, reason, rule, claimIndex, evidence.Verified);
        }
        catch (JsonException)
        {
            return Indeterminate("incompatible_claim_or_evidence_schema");
        }
    }

    private static async Task<(HistoricalClaimVerdict, string)> EvaluateAuthorityAsync(HistoricalReplayDescriptor descriptor,
        JsonElement original, HistoricalClaimInputs evidence, int claimIndex, CancellationToken ct)
    {
        if (!ReadTime(original, "recordedUtc", out var at) || at != descriptor.RecordedUtc
            || !original.TryGetProperty("claims", out var claims) || claims.ValueKind != JsonValueKind.Array
            || claimIndex >= claims.GetArrayLength() || claims[claimIndex].ValueKind != JsonValueKind.String
            || claims[claimIndex].GetString() is not { } value || value.Length > 512
            || value.Split('|') is not ["control-state-v1", var resource, var control, var asserted]
            || !Key(resource) || !Key(control) || !State(asserted))
            return Unknown("unsupported_or_unbound_control_claim");

        var refBytes = await evidence.GetAsync(HistoricalArtifactRole.SourceEvidence, AuthorityEvidence);
        var observedBytes = await evidence.GetAsync(HistoricalArtifactRole.SourceEvidence, AuthorityObservationSchema, AuthorityStage);
        if (refBytes is null || observedBytes is null)
            return Unknown("independent_control_evidence_unavailable");

        using var refsDoc = Parse(refBytes);
        using var observations = Parse(observedBytes);
        var refs = refsDoc.RootElement.Deserialize<RecordedReferences>(Web);
        var capture = observations.RootElement.Deserialize<ControlCapture>(Web);
        if (descriptor.SourceCoverage != HistoricalCoverage.Complete
            || capture is not { CoverageComplete: true, Observations: { } rows } || refs?.References is not { } authorizedRefs)
            return Unknown("independent_control_coverage_incomplete");

        var allowed = authorizedRefs.ToHashSet(StringComparer.Ordinal);
        var matching = new HashSet<string>(StringComparer.Ordinal);
        foreach (var row in rows)
        {
            ct.ThrowIfCancellationRequested();
            if (row is null)
                return Unknown("invalid_control_observation");
            if (row.Resource != resource || row.Control != control)
                continue;
            if (row.ObservedUtc == default || row.ValidUntilUtc < row.ObservedUtc)
                return Unknown("invalid_control_observation");
            if (row.ObservedUtc > at || row.ValidUntilUtc < at)
                continue;
            if (!State(row.State) || row.EvidenceRef is not { } evidenceRef || !Key(evidenceRef) || !allowed.Contains(evidenceRef))
                return Unknown("unverified_control_observation");
            matching.Add(row.State!);
        }
        return matching.Count == 1 ? Compare(asserted, matching.Single()) : Unknown("absent_or_conflicting_control_observations");
    }

    private static async Task<(HistoricalClaimVerdict, string)> EvaluateSecureNowAsync(HistoricalReplayDescriptor descriptor,
        JsonElement original, HistoricalClaimInputs evidence, int claimIndex, CancellationToken ct)
    {
        var run = descriptor.Source.Run;
        if (claimIndex != 0 || !ReadTime(original, "recordedUtc", out var at) || at != descriptor.RecordedUtc
            || !ReadTime(original, "captureUtc", out var captured) || !MatchesGuid(original, "snapshotId", run.SnapshotId)
            || !MatchesGuid(original, "findingId", run.FindingId)
            || Text(original, "directExposureEvidence") != "present" || Text(original, "target") is not { } target || !Key(target, 1024)
            || !original.TryGetProperty("hops", out var hops) || hops.ValueKind != JsonValueKind.Array
            || !hops.EnumerateArray().Any(hop => hop.ValueKind == JsonValueKind.Object
                && Text(hop, "fromNodeId") == SecureNowArchitectConstants.InternetPublicExposureNodeId
                && string.Equals(Text(hop, "toNodeId"), target, StringComparison.OrdinalIgnoreCase)
                && Text(hop, "edgeType") == SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType
                && Text(hop, "provenance") == nameof(ProvenanceKind.ObservedFact)))
            return Unknown("unsupported_or_unbound_exposure_claim");

        var snapshotBytes = await evidence.GetAsync(HistoricalArtifactRole.SourceEvidence, SecureNowEvidence);
        var policyBytes = await evidence.GetAsync(HistoricalArtifactRole.EffectivePolicy, SecureNowPolicy);
        var configBytes = await evidence.GetAsync(HistoricalArtifactRole.Configuration, SecureNowConfiguration);
        if (snapshotBytes is null || policyBytes is null || configBytes is null)
            return Unknown("independent_inventory_or_historical_settings_unavailable");

        using var source = Parse(snapshotBytes);
        using var policyDoc = Parse(policyBytes);
        using var configDoc = Parse(configBytes);
        var snapshot = source.RootElement.Deserialize<AzureInventorySnapshotDetailReadModel>(Web);
        var policy = policyDoc.RootElement.Deserialize<HistoricalFreshness>(Web);
        var config = configDoc.RootElement.Deserialize<HistoricalTarget>(Web);
        if (snapshot is not { Header: { CapturedUtc: { } recordedCapture } header, Resources: { } resources, Properties: { } properties }
            || policy?.MaximumCaptureAgeHours is not (> 0 and <= 8760) || !string.Equals(config?.Target, target, StringComparison.OrdinalIgnoreCase)
            || header.SnapshotId != run.SnapshotId || !run.Scope.Matches(header.TenantId, header.WorkspaceId, header.ProjectId)
            || header.ContentHashSha256 is not { Length: 32 }
            || !HistoricalReplayDescriptorValidation.SameHash(Convert.ToHexString(header.ContentHashSha256), descriptor.Source.CommitmentSha256)
            || header.CaptureStatus != AzureInventoryCaptureStatus.Succeeded || header.CompletenessScore != 1m
            || descriptor.SourceCoverage != HistoricalCoverage.Complete || header.WarningCount != 0 || header.ErrorCount != 0
            || new DateTimeOffset(DateTime.SpecifyKind(recordedCapture, DateTimeKind.Utc)) != captured
            || captured > at || at - captured > TimeSpan.FromHours(policy.MaximumCaptureAgeHours.Value)
            || resources.Any(row => row is null || row.TenantId != run.TenantId || row.SnapshotId != run.SnapshotId))
            return Unknown("snapshot_scope_freshness_or_coverage_unverified");

        var targets = resources.Where(row => string.Equals(row.AzureResourceId, target, StringComparison.OrdinalIgnoreCase)).ToArray();
        if (targets is not [var resource] || resource.ResourceRowId == Guid.Empty
            || resources.Count(row => row.ResourceRowId == resource.ResourceRowId) != 1)
            return Unknown("target_inventory_row_missing_or_ambiguous");

        HashSet<string> observed = new(StringComparer.Ordinal);
        foreach (var row in properties)
        {
            ct.ThrowIfCancellationRequested();
            if (row is null)
                return Unknown("invalid_inventory_observation");
            if (row.ResourceRowId != resource.ResourceRowId)
                continue;
            var key = row.PropertyKey?.ToLowerInvariant();
            if (key is not ("publicnetworkaccess" or "properties.publicnetworkaccess"
                or "enablepublicnetworkaccess" or "properties.enablepublicnetworkaccess"))
                continue;
            var value = row.PropertyValue?.Trim().ToLowerInvariant();
            var state = key switch
            {
                "publicnetworkaccess" or "properties.publicnetworkaccess" => value,
                "enablepublicnetworkaccess" or "properties.enablepublicnetworkaccess" => value switch
                {
                    "true" => "enabled",
                    "false" => "disabled",
                    _ => null,
                },
                _ => null,
            };
            // Only an explicit observed setting decides this narrow claim. No graph heuristic or inferred/absent edge is evidence.
            if (row.IsRedacted || state is not ("enabled" or "disabled"))
                return Unknown("unverified_public_network_setting");
            observed.Add(state);
        }
        return observed.Count == 1 ? Compare("enabled", observed.Single()) : Unknown("absent_or_conflicting_public_network_settings");
    }

    private static bool State(string? value) => value is "enabled" or "disabled";

    private static bool Key(string? value, int max = 192) => value is { Length: > 0 } && value.Length <= max
        && value == value.Trim() && !value.Any(character => char.IsControl(character) || character == '|');

    private static string? Text(JsonElement json, string name) =>
        json.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private static bool ReadTime(JsonElement json, string name, out DateTimeOffset time)
    {
        time = default;
        return json.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            && Text(json, name) is { } text && (text.EndsWith('Z') || text.Length > 6 && text[^6] is '+' or '-')
            && value.TryGetDateTimeOffset(out time);
    }

    private static bool MatchesGuid(JsonElement json, string name, Guid? expected) =>
        expected is not null && Guid.TryParseExact(Text(json, name), "D", out var actual) && actual == expected;

    private static (HistoricalClaimVerdict, string) Unknown(string reason) => (HistoricalClaimVerdict.Indeterminate, reason);

    private static (HistoricalClaimVerdict, string) Compare(string asserted, string observed) =>
        asserted == observed ? (HistoricalClaimVerdict.Supported, "direct_observation_agrees")
            : (HistoricalClaimVerdict.Refuted, "direct_observation_contradicts");

    private static JsonDocument Parse(byte[] input)
    {
        var doc = JsonDocument.Parse(input, new JsonDocumentOptions { MaxDepth = 32 });
        if (doc.RootElement.ValueKind == JsonValueKind.Object && Unique(doc.RootElement))
            return doc;
        doc.Dispose();
        throw new JsonException("Ambiguous or unsupported historical fixture shape.");
    }

    private static bool Unique(JsonElement item) => item.ValueKind switch
    {
        JsonValueKind.Object => item.EnumerateObject().Select(row => row.Name).Distinct(StringComparer.Ordinal).Count()
            == item.EnumerateObject().Count() && item.EnumerateObject().All(row => Unique(row.Value)),
        JsonValueKind.Array => item.EnumerateArray().All(Unique),
        _ => true,
    };

    private sealed record RecordedReferences(string[]? References);
    private sealed record ControlCapture(bool CoverageComplete, ControlObservation?[]? Observations);
    private sealed record ControlObservation(string? Resource, string? Control, string? State, string? EvidenceRef,
        DateTimeOffset ObservedUtc, DateTimeOffset ValidUntilUtc);
    private sealed record HistoricalFreshness(int? MaximumCaptureAgeHours);
    private sealed record HistoricalTarget(string? Target);
}
