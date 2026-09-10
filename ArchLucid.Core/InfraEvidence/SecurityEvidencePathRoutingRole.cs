namespace ArchLucid.Core.InfraEvidence;

/// <summary>Organizational routing role on a SecureNow path (SA-15).</summary>
public enum SecurityEvidencePathRoutingRole
{
    BusinessOwner = 0,
    TechnicalOwner = 1,
    SecurityOwner = 2,
    Remediator = 3,
    VerificationOwner = 4,
    RequiredApproval = 5,
}

public static class SecurityEvidencePathRoutingConstants
{
    public const string EmptyReasonNoOwnerTag = "no-owner-tag";

    public const string SourcePrefixTag = "tag:";

    public const string SourcePrefixHumanAssertion = "human-assertion:";

    /// <summary>Documented Azure tag keys (case-insensitive) mapped to routing roles.</summary>
    public const string TagKeyOwner = "owner";

    public const string TagKeyApplication = "application";

    public const string TagKeyCostCenter = "costCenter";

    public const string TagKeyTechnicalOwner = "technicalOwner";

    public const string TagKeySecurityOwner = "securityOwner";

    public const string TagKeyRemediator = "remediator";

    public const string TagKeyVerificationOwner = "verificationOwner";
}
