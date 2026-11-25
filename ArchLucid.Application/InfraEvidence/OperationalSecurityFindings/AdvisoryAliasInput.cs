using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;

internal sealed record AdvisoryAliasInput
{
    internal const string MetadataKey = "securenow.advisory-alias.v1";
    internal const string AuthorityKey = "securenow.advisory.authority.v1";
    internal const string ProvenancePrefix = "securenow.advisory.source.";
    internal const string CanonicalSource = "ArchLucid.SecureNow.Advisory";

    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    private static readonly JsonSerializerOptions CanonicalEvidenceOptions = new(JsonSerializerDefaults.Web)
    {
        IgnoreReadOnlyProperties = true,
    };

    public string? CveId { get; init; }
    public string? TargetKey { get; init; }
    public string? Revision { get; init; }
    public bool ReferenceOnly { get; init; }
    public string? DefenderRecommendationId { get; init; }
    public string? CrosswalkVersion { get; init; }

    internal static AdvisoryAliasInput? Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            AdvisoryAliasInput? value = JsonSerializer.Deserialize<AdvisoryAliasInput>(json, Options);
            if (value is null || !TryNormalizeCve(value.CveId, out string cve)
                || value.TargetKey?.Trim().ToUpperInvariant() is not { Length: > 0 and <= 128 } target
                || !target.All(ch => char.IsAsciiLetterOrDigit(ch) || ch is '.' or '_' or '/' or '-')
                || string.IsNullOrWhiteSpace(value.Revision)
                || (string.IsNullOrWhiteSpace(value.DefenderRecommendationId)
                    != string.IsNullOrWhiteSpace(value.CrosswalkVersion)))
                return null;

            return value with { CveId = cve, TargetKey = target, Revision = value.Revision.Trim() };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    internal string CanonicalEvidence(AdvisoryRemediationEvidence evidence) =>
        JsonSerializer.Serialize(evidence with { AdvisoryId = CveId }, CanonicalEvidenceOptions);

    internal byte[] MaterialHash(OperationalSecurityFindingIngestItem item, AdvisoryRemediationEvidence evidence)
    {
        string json = JsonSerializer.Serialize(new
        {
            evidence.Owner,
            evidence.ProviderFix,
            evidence.CustomerAction,
            FixedArtifact = evidence.FixedDeploymentArtifactSha256?.ToLowerInvariant(),
            CompensatingControl = evidence.CompensatingControlEvidenceReference?.Trim(),
            Severity = item.Severity?.Trim().ToUpperInvariant(),
            RiskScore = item.RiskScore?.ToString("G29", System.Globalization.CultureInfo.InvariantCulture),
            Exploitability = item.Exploitability?.Trim().ToUpperInvariant(),
            Exposure = item.Exposure?.Trim().ToUpperInvariant(),
            BusinessCriticality = item.BusinessCriticality?.Trim().ToUpperInvariant(),
            BlastRadius = item.BlastRadius?.Trim().ToUpperInvariant(),
            item.ControlId,
            item.PathId,
        }, Options);
        return SHA256.HashData(Encoding.UTF8.GetBytes(json));
    }

    internal string FindingKey(Guid? cloudResourceId) =>
        $"{CveId}:{cloudResourceId?.ToString("N") ?? "platform"}:{TargetKey}";

    internal KeyValuePair<string, string?> CreateProvenance(
        OperationalSecurityFindingIngestItem source, AdvisoryRemediationEvidence evidence, string actorId)
    {
        var identity = new
        {
            sourceSystem = source.SourceSystem.Trim(),
            sourceFindingId = source.SourceFindingId.Trim(),
            publisherAdvisoryId = evidence.AdvisoryId,
            evidence.SourceUrl,
            source.RawEvidenceReference,
            DefenderRecommendationId,
            CrosswalkVersion,
            Revision,
            ReferenceOnly,
        };
        string json = JsonSerializer.Serialize(new { identity, submittedBy = actorId.Trim() }, Options);
        string key = ProvenancePrefix + Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(identity, Options)));
        return new KeyValuePair<string, string?>(key, json);
    }

    internal static bool UsesReservedIdentity(OperationalSecurityFindingIngestItem item) =>
        string.Equals(item.SourceSystem.Trim(), CanonicalSource, StringComparison.OrdinalIgnoreCase)
        || item.Metadata.Keys.Any(key => string.Equals(key.Trim(), AuthorityKey, StringComparison.OrdinalIgnoreCase)
            || key.Trim().StartsWith(ProvenancePrefix, StringComparison.OrdinalIgnoreCase));

    private static bool TryNormalizeCve(string? input, out string cve)
    {
        cve = input?.Trim().ToUpperInvariant() ?? string.Empty;
        return cve.Length is >= 13 and <= 27
            && cve.StartsWith("CVE-", StringComparison.Ordinal)
            && cve[8] == '-'
            && cve.AsSpan(4, 4).IndexOfAnyExceptInRange('0', '9') < 0
            && cve.AsSpan(9).IndexOfAnyExceptInRange('0', '9') < 0;
    }
}
