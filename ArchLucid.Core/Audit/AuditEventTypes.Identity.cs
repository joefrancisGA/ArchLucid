namespace ArchLucid.Core.Audit;

// Identity, authentication, directory federation, SCIM provisioning, roles, and admin security actions.
public static partial class AuditEventTypes
{
    /// <summary>Admin issued new host API key rotation material (payload excludes key material).</summary>
    public const string AdminApiKeyRotationMaterialIssued = "Admin.ApiKeyRotationMaterialIssued";

    /// <summary>Tenant admin created a pending user invitation (<c>POST /v1/admin/users/invite</c>).</summary>
    public const string AdminUserInvitationCreated = "Admin.UserInvitationCreated";

    /// <summary>Tenant admin revoked a pending user invitation.</summary>
    public const string AdminUserInvitationRevoked = "Admin.UserInvitationRevoked";

    /// <summary>Canonical platform user created from a verified external identity.</summary>
    public const string PlatformUserCreated = "Identity.PlatformUserCreated";

    /// <summary>Authentication identity created for a new platform user.</summary>
    public const string AuthenticationIdentityCreated = "Identity.AuthenticationIdentityCreated";

    /// <summary>Authentication identity attached to an existing platform user.</summary>
    public const string AuthenticationIdentityAttached = "Identity.AuthenticationIdentityAttached";

    /// <summary>Authentication identity disabled (user retained).</summary>
    public const string AuthenticationIdentityDisabled = "Identity.AuthenticationIdentityDisabled";

    public const string AuthenticationIdentityLinkChallengeRequested = "Identity.AuthenticationIdentityLinkChallengeRequested";

    public const string AuthenticationIdentityLinkProposed = "Identity.AuthenticationIdentityLinkProposed";

    public const string AuthenticationIdentityLinkConfirmed = "Identity.AuthenticationIdentityLinkConfirmed";

    public const string AuthenticationIdentityLinkCancelled = "Identity.AuthenticationIdentityLinkCancelled";

    public const string AuthenticationIdentityLinkFailed = "Identity.AuthenticationIdentityLinkFailed";

    public const string AuthenticationIdentityRemovalRequested = "Identity.AuthenticationIdentityRemovalRequested";

    public const string EmailOtpCodeRequested = "Identity.EmailOtpCodeRequested";

    public const string EmailOtpCodeSent = "Identity.EmailOtpCodeSent";

    public const string EmailOtpVerificationSucceeded = "Identity.EmailOtpVerificationSucceeded";

    public const string EmailOtpVerificationFailed = "Identity.EmailOtpVerificationFailed";

    public const string EmailOtpRateLimitTriggered = "Identity.EmailOtpRateLimitTriggered";

    public const string EmailOtpSsoRedirectRequired = "Identity.EmailOtpSsoRedirectRequired";

    public const string EmailOtpSuspiciousBehaviorDetected = "Identity.EmailOtpSuspiciousBehaviorDetected";

    public const string AuthDomainProposed = "Identity.AuthDomainProposed";

    public const string AuthDomainVerificationStarted = "Identity.AuthDomainVerificationStarted";

    public const string AuthDomainVerificationChecked = "Identity.AuthDomainVerificationChecked";

    public const string AuthDomainEnforcementEnabled = "Identity.AuthDomainEnforcementEnabled";

    public const string AuthDomainRecoveryAdminAdded = "Identity.AuthDomainRecoveryAdminAdded";

    public const string AuthDomainRecoveryAdminRemoved = "Identity.AuthDomainRecoveryAdminRemoved";

    public const string AuthDomainRemoved = "Identity.AuthDomainRemoved";

    public const string AuthDomainEnforcementModeChanged = "Identity.AuthDomainEnforcementModeChanged";

    public const string AuthDomainRecoveryBypassUsed = "Identity.AuthDomainRecoveryBypassUsed";

    public const string AuthDomainRecoveryAdminAuthenticationVerified = "Identity.AuthDomainRecoveryAdminAuthenticationVerified";

    public const string AuthDomainLastRecoveryPathRemoved = "Identity.AuthDomainLastRecoveryPathRemoved";

    public const string PlatformTenantAuthRecoveryGranted = "Identity.PlatformTenantAuthRecoveryGranted";

    public const string PlatformTenantAuthRecoveryRevoked = "Identity.PlatformTenantAuthRecoveryRevoked";

    public const string PlatformTenantAuthRecoveryTenantNotified = "Identity.PlatformTenantAuthRecoveryTenantNotified";

    public const string PlatformTenantAuthRecoveryUnauthorizedAttempt = "Identity.PlatformTenantAuthRecoveryUnauthorizedAttempt";

    public const string UserAccountPrimaryEmailChangeRequested = "Identity.UserAccountPrimaryEmailChangeRequested";

    public const string UserAccountPrimaryEmailChanged = "Identity.UserAccountPrimaryEmailChanged";

    public const string AuthSignInRoutingEvaluated = "Identity.AuthSignInRoutingEvaluated";

    public const string PostAuthWorkspaceCreated = "Identity.PostAuthWorkspaceCreated";

    public const string PostAuthInitialOwnerAssigned = "Identity.PostAuthInitialOwnerAssigned";

    public const string PostAuthExistingOrganizationDetected = "Identity.PostAuthExistingOrganizationDetected";

    public const string PostAuthAccessRequestInitiated = "Identity.PostAuthAccessRequestInitiated";

    public const string PostAuthWorkspaceCreationDenied = "Identity.PostAuthWorkspaceCreationDenied";

    public const string AdminUserInvitationAccepted = "Admin.UserInvitationAccepted";

    public const string UserInvitationValidated = "Identity.UserInvitationValidated";

    /// <summary>Admin invoked JWT role-claim diagnostic (<c>POST /v1/admin/auth/diagnose-token</c>); payload excludes token material.</summary>
    public const string AuthTokenDiagnosticRequested = "Auth.TokenDiagnosticRequested";

    /// <summary>
    ///     Admin viewed internal deployment-status (<c>GET /v1/admin/deployment-status</c>); payload excludes secrets.
    /// </summary>
    public const string AdminDeploymentStatusViewed = "Admin.DeploymentStatusViewed";

    public const string ApiKeyRotated = "Security.ApiKeyRotated";

    /// <summary>
    ///     Trust center: a third-party or owner-approved security assessment summary was published for procurement / customer
    ///     review
    ///     (payload: assessment code, summary reference, optional assessor display name).
    /// </summary>
    public const string SecurityAssessmentPublished = "SecurityAssessmentPublished";

    public const string ScimTokenIssued = "ScimTokenIssued";

    public const string ScimTokenRevoked = "ScimTokenRevoked";

    public const string ScimUserProvisioned = "ScimUserProvisioned";

    public const string ScimUserUpdated = "ScimUserUpdated";

    /// <summary>SCIM IdP group-derived role superseded an operator-managed SCIM <c>manualResolvedRole</c> assignment.</summary>
    public const string RoleOverriddenByScim = "RoleOverriddenByScim";

    public const string ScimUserDeactivated = "ScimUserDeactivated";

    public const string ScimGroupProvisioned = "ScimGroupProvisioned";

    public const string ScimGroupMembershipChanged = "ScimGroupMembershipChanged";

    /// <summary>
    ///     SAML 2.0 SP session cookie issued after a successful assertion (ITfoxtec <c>saml2</c> cookie scheme). Payload
    ///     stays minimal (name id prefix, tenant claim hint — never raw assertion XML or full subject).
    /// </summary>
    public const string Saml2ServiceProviderSignInSucceeded = "Saml2ServiceProviderSignInSucceeded";

    /// <summary>
    ///     SAML 2.0 SP sign-in failed on an <c>/Auth/*</c> route (assertion validation, replay, clock skew, malformed
    ///     protocol, etc.). Payload records exception type and request path only — not vendor exception text.
    /// </summary>
    public const string Saml2ServiceProviderSignInFailed = "Saml2ServiceProviderSignInFailed";

    /// <summary>Admin SSO wizard activated a tenant-scoped identity provider configuration row.</summary>
    public const string IdentitySsoConfigurationActivated = "Identity.SsoConfigurationActivated";

    /// <summary>Admin created a tenant custom role.</summary>
    public const string IdentityCustomRoleCreated = "Identity.CustomRoleCreated";

    /// <summary>Admin updated a tenant custom role.</summary>
    public const string IdentityCustomRoleUpdated = "Identity.CustomRoleUpdated";

    /// <summary>Admin assigned a custom role to a directory user.</summary>
    public const string IdentityCustomRoleAssigned = "Identity.CustomRoleAssigned";
}
