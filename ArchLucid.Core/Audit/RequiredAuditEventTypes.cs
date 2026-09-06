namespace ArchLucid.Core.Audit;

/// <summary>
///     INV-003 / TB-954: wire values for audit event types that must fail closed via
///     <see cref="DurableAuditLogRetry.LogOrThrowAsync" /> — never
///     <see cref="DurableAuditLogRetry.TryLogAsync" />.
/// </summary>
/// <remarks>
///     <para>
///         <b>How to add a Required type</b>
///     </para>
///     <list type="number">
///         <item>Add (or reuse) a constant on <see cref="AuditEventTypes" />.</item>
///         <item>Append that constant to <see cref="All" /> below (compile-time reference).</item>
///         <item>
///             Emit the event only through <see cref="DurableAuditLogRetry.LogOrThrowAsync" />
///             (or a helper that calls it). Do not use soft-fail wrappers.
///         </item>
///         <item>
///             Architecture tests in <c>AuditPathClassificationArchitectureTests</c> fail CI if the type
///             appears with <c>TryLogAsync</c> in the same method, or if a <c>LogRequired*</c> helper soft-fails.
///         </item>
///     </list>
///     <para>
///         Informational / telemetry types stay off this list and may use <see cref="DurableAuditLogRetry.TryLogAsync" />
///         (TB-001).
///     </para>
/// </remarks>
public static class RequiredAuditEventTypes
{
    /// <summary>
    ///     Minimum Required set migrated under TB-953 (governance disposition, finalize, identity/SCIM access,
    ///     risk waiver, export attestation).
    /// </summary>
    public static IReadOnlyList<string> All { get; } =
    [
        AuditEventTypes.GovernanceApprovalSubmitted,
        AuditEventTypes.GovernanceApprovalApproved,
        AuditEventTypes.GovernanceApprovalRejected,
        AuditEventTypes.GovernanceManifestPromoted,
        AuditEventTypes.GovernanceEnvironmentActivated,
        AuditEventTypes.GovernanceMutationCorrectionRecorded,
        AuditEventTypes.GovernanceSelfApprovalBlocked,
        AuditEventTypes.RunOperatorGovernanceDispositionRecorded,
        AuditEventTypes.RiskExceptionCreated,
        AuditEventTypes.RiskExceptionRevoked,
        AuditEventTypes.RiskExceptionRenewed,
        AuditEventTypes.RiskExceptionExpired,
        AuditEventTypes.ManifestFinalized,
        AuditEventTypes.Run.CommitCompleted,
        AuditEventTypes.IdentityCustomRoleAssigned,
        AuditEventTypes.RoleOverriddenByScim,
        AuditEventTypes.ScimGroupMembershipChanged,
        AuditEventTypes.ArchitectureDocxExportGenerated,
    ];

    /// <summary>
    ///     C# identifier suffixes after <c>AuditEventTypes.</c> for syntax-only architecture scans
    ///     (order matches <see cref="All" />).
    /// </summary>
    public static IReadOnlyList<string> ConstNames { get; } =
    [
        nameof(AuditEventTypes.GovernanceApprovalSubmitted),
        nameof(AuditEventTypes.GovernanceApprovalApproved),
        nameof(AuditEventTypes.GovernanceApprovalRejected),
        nameof(AuditEventTypes.GovernanceManifestPromoted),
        nameof(AuditEventTypes.GovernanceEnvironmentActivated),
        nameof(AuditEventTypes.GovernanceMutationCorrectionRecorded),
        nameof(AuditEventTypes.GovernanceSelfApprovalBlocked),
        nameof(AuditEventTypes.RunOperatorGovernanceDispositionRecorded),
        nameof(AuditEventTypes.RiskExceptionCreated),
        nameof(AuditEventTypes.RiskExceptionRevoked),
        nameof(AuditEventTypes.RiskExceptionRenewed),
        nameof(AuditEventTypes.RiskExceptionExpired),
        nameof(AuditEventTypes.ManifestFinalized),
        nameof(AuditEventTypes.Run) + "." + nameof(AuditEventTypes.Run.CommitCompleted),
        nameof(AuditEventTypes.IdentityCustomRoleAssigned),
        nameof(AuditEventTypes.RoleOverriddenByScim),
        nameof(AuditEventTypes.ScimGroupMembershipChanged),
        nameof(AuditEventTypes.ArchitectureDocxExportGenerated),
    ];

    public static bool IsRequired(string? eventType)
    {
        if (string.IsNullOrWhiteSpace(eventType))
            return false;

        string normalized = eventType.Trim();

        for (int i = 0; i < All.Count; i++)
        {
            if (string.Equals(All[i], normalized, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
