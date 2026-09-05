namespace ArchLucid.Core.Configuration.Summary;

/// <summary>
///     Detects configuration path segments that should be redacted in operator summaries.
/// </summary>
internal static class ConfigurationSensitiveConfigPathMatcher
{
    private static readonly string[] SensitiveSegmentFragments =
    [
        "ConnectionString",
        "Password",
        "Secret",
        "Token",
        "ApiKey",
        "PrivateKey",
    ];

    public static bool IsSensitiveConfigPath(string configPath)
    {
        if (string.IsNullOrWhiteSpace(configPath))
            return false;

        foreach (string segment in configPath.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (IsSensitiveConfigSegment(segment))
                return true;
        }

        return configPath.EndsWith(":Key", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSensitiveConfigSegment(string segment)
    {
        ReadOnlySpan<char> normalized = segment.AsSpan();

        if (normalized.Equals("Key", StringComparison.OrdinalIgnoreCase))
            return true;

        if (normalized.Equals("PrivateKey", StringComparison.OrdinalIgnoreCase)
            || IsPrivateKeyCredentialSegment(normalized)
            || IsExplicitCredentialConfigSegment(normalized))
            return true;

        foreach (string fragment in SensitiveSegmentFragments)
        {
            if (SegmentContainsSensitiveFragment(normalized, fragment))
                return true;
        }

        return false;
    }

    private static bool SegmentContainsSensitiveFragment(ReadOnlySpan<char> segment, string fragment)
    {
        int index = 0;

        while (index < segment.Length)
        {
            int relativeIndex = segment.Slice(index).IndexOf(fragment.AsSpan(), StringComparison.OrdinalIgnoreCase);

            if (relativeIndex < 0)
                return false;

            index += relativeIndex;

            if (!IsNegatedSensitiveFragment(segment, index, fragment)
                && !IsEmbeddedSensitiveFragment(segment, index))
                return true;

            index++;
        }

        return false;
    }

    private static bool IsExplicitCredentialConfigSegment(ReadOnlySpan<char> segment)
    {
        return segment.Equals("ClientSecret", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PrimaryKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SecondaryKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AccountKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SharedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SecondaryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PrimaryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AccountSharedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("StorageAccountKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("BlobAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FileAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("QueueAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("TableAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DiskAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("WebAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ManageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DfsAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CosmosAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ApiAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DataLakeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ServiceAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EventAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PortalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AdminAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SasAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("BackupAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MasterAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RootAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AccountAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("StorageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("KeyAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DefaultAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SigningKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SigningCertificate", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SigningCertificatePath", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CertificateThumbprint", StringComparison.OrdinalIgnoreCase)
            || IsCertificateCredentialSegment(segment);
    }

    private static bool IsCertificateCredentialSegment(ReadOnlySpan<char> segment)
    {
        return segment.EndsWith("CertificatePath", StringComparison.OrdinalIgnoreCase)
            || segment.EndsWith("CertificateThumbprint", StringComparison.OrdinalIgnoreCase)
            || segment.EndsWith("Certificate", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateKeyCredentialSegment(ReadOnlySpan<char> segment)
    {
        const string privateKeyPemMarker = "PrivateKeyPem";

        int markerIndex = segment.IndexOf(privateKeyPemMarker.AsSpan(), StringComparison.OrdinalIgnoreCase);

        if (markerIndex < 0)
            return false;

        return !IsNegatedSensitiveFragment(segment, markerIndex, "PrivateKey");
    }

    private static bool IsEmbeddedSensitiveFragment(ReadOnlySpan<char> segment, int fragmentIndex)
    {
        if (fragmentIndex > 0 && char.IsLetter(segment[fragmentIndex - 1]))
            return true;

        return false;
    }

    private static bool IsNegatedSensitiveFragment(ReadOnlySpan<char> segment, int fragmentIndex, string fragment)
    {
        if (IsNonPrefixedNegation(segment, fragmentIndex))
            return true;

        if (IsNoPrefixedNegation(segment, fragmentIndex))
            return true;

        if (IsUnPrefixedNegation(segment, fragmentIndex))
            return true;

        if (fragment.Equals("Password", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("ConnectionString", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("Secret", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("Token", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("ApiKey", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("PrivateKey", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        return false;
    }

    private static bool IsNonPrefixedNegation(ReadOnlySpan<char> segment, int fragmentIndex)
    {
        ReadOnlySpan<char> before = segment.Slice(0, fragmentIndex);

        if (before.Length < 3)
            return false;

        return before.EndsWith("non", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNoPrefixedNegation(ReadOnlySpan<char> segment, int fragmentIndex)
    {
        ReadOnlySpan<char> before = segment.Slice(0, fragmentIndex);

        if (before.Length < 2)
            return false;

        return before.EndsWith("no", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsUnPrefixedNegation(ReadOnlySpan<char> segment, int fragmentIndex)
    {
        ReadOnlySpan<char> before = segment.Slice(0, fragmentIndex);

        if (before.Length < 2)
            return false;

        return before.EndsWith("un", StringComparison.OrdinalIgnoreCase);
    }
}
