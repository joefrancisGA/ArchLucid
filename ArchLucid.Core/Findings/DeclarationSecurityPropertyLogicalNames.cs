namespace ArchLucid.Core.Findings;

/// <summary>
///     Logical declaration-security property names used by <see cref="DeclarationSecurityPropertyKeyResolver" />.
/// </summary>
public static class DeclarationSecurityPropertyLogicalNames
{
    public const string PublicNetworkAccess = nameof(PublicNetworkAccess);

    public const string AllowBlobPublicAccess = nameof(AllowBlobPublicAccess);

    public const string HttpsOnly = nameof(HttpsOnly);

    public const string MinimumTlsVersion = nameof(MinimumTlsVersion);

    public const string SslEnforcementEnabled = nameof(SslEnforcementEnabled);

    public const string IngressBlob = nameof(IngressBlob);

    /// <summary>Encryption-at-rest / TDE / disk encryption (AWS <c>storageEncrypted</c>, etc.).</summary>
    public const string StorageEncrypted = nameof(StorageEncrypted);

    /// <summary>Storage network ACL default action or equivalent deny-by-default posture.</summary>
    public const string NetworkAclDefaultAction = nameof(NetworkAclDefaultAction);

    /// <summary>Kubernetes privileged container flag (<c>k8s.privileged</c>).</summary>
    public const string K8sPrivileged = nameof(K8sPrivileged);

    /// <summary>Kubernetes hostNetwork pod spec flag (<c>k8s.hostNetwork</c>).</summary>
    public const string K8sHostNetwork = nameof(K8sHostNetwork);

    // Skipped: K8sHostPath — declaration parser sets k8s.privileged/hostNetwork but scoped inventory
    // extractors do not persist a hostPath scalar on resources.json rows today (R5).
}
