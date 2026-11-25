using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Core.InfraEvidence;

[JsonConverter(typeof(JsonStringEnumConverter<AdvisoryRemediationOwner>))]
public enum AdvisoryRemediationOwner { Undetermined, Provider, Customer, Shared }

[JsonConverter(typeof(JsonStringEnumConverter<AdvisoryProviderFix>))]
public enum AdvisoryProviderFix { Unknown, Pending, Fixed, NotApplicable }

[JsonConverter(typeof(JsonStringEnumConverter<AdvisoryCustomerAction>))]
public enum AdvisoryCustomerAction { Unknown, NotRequired, Required }

/// <summary>Publisher guidance as reported by the scoped submitter, not proof of deployment or historical exposure.</summary>
public sealed record AdvisoryRemediationEvidence
{
    public const string MetadataKey = "securenow.advisory-remediation.v1";
    public const string ObservedDeployedArtifactProperty = "observedDeployedArtifactSha256";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public string? AdvisoryId { get; init; }
    public string? SourceUrl { get; init; }
    public AdvisoryRemediationOwner Owner { get; init; }
    public AdvisoryProviderFix ProviderFix { get; init; }
    public AdvisoryCustomerAction CustomerAction { get; init; }
    public string? CompensatingControlEvidenceReference { get; init; }
    public string? FixedDeploymentArtifactSha256 { get; init; }

    public bool IsInformational =>
        Owner == AdvisoryRemediationOwner.Provider
        && ProviderFix == AdvisoryProviderFix.Fixed
        && CustomerAction == AdvisoryCustomerAction.NotRequired;

    public string? RequiredVerificationQuery =>
        IsSha256(FixedDeploymentArtifactSha256) && !IsInformational
            ? $"property:{ObservedDeployedArtifactProperty}={FixedDeploymentArtifactSha256!.ToLowerInvariant()}"
            : null;

    public static bool IsMetadataKey(string key) =>
        string.Equals(key.Trim(), MetadataKey, StringComparison.OrdinalIgnoreCase);

    public static AdvisoryRemediationEvidence? Parse(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 1024)
            return null;

        AdvisoryRemediationEvidence? evidence;
        try
        {
            evidence = JsonSerializer.Deserialize<AdvisoryRemediationEvidence>(value, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }

        if (evidence is null
            || string.IsNullOrWhiteSpace(evidence.AdvisoryId)
            || !Uri.TryCreate(evidence.SourceUrl, UriKind.Absolute, out Uri? uri)
            || uri.Scheme != Uri.UriSchemeHttps || uri.Host.Length == 0 || uri.UserInfo.Length != 0
            || !Enum.IsDefined(evidence.Owner)
            || !Enum.IsDefined(evidence.ProviderFix)
            || !Enum.IsDefined(evidence.CustomerAction))
            return null;

        bool customerWork = evidence.Owner is AdvisoryRemediationOwner.Customer or AdvisoryRemediationOwner.Shared;
        if ((customerWork && evidence.CustomerAction != AdvisoryCustomerAction.Required)
            || (evidence.Owner == AdvisoryRemediationOwner.Provider && evidence.CustomerAction == AdvisoryCustomerAction.Required)
            || (evidence.Owner == AdvisoryRemediationOwner.Undetermined && evidence.CustomerAction != AdvisoryCustomerAction.Unknown)
            || (evidence.FixedDeploymentArtifactSha256 is not null
                && (!customerWork || !IsSha256(evidence.FixedDeploymentArtifactSha256))))
            return null;

        return evidence;
    }

    private static bool IsSha256(string? value) =>
        value is { Length: 64 } && value.All(Uri.IsHexDigit);
}
