namespace ArchLucid.Core.AzureExtractor;

/// <summary>Redacts secret-like ARM property keys before persistence or hashing.</summary>
public static class AzureExtractorSensitivePropertyRedactor
{
    private static readonly string[] SensitiveKeyFragments =
    [
        "secret",
        "password",
        "connectionstring",
        "privatekey",
        "certificate",
        "accesskey",
        "accountkey",
        "clientsecret",
        "primarykey",
        "secondarykey",
    ];

    public static bool IsSensitiveKey(string? propertyKey)
    {
        if (string.IsNullOrWhiteSpace(propertyKey))
            return false;

        string normalized = propertyKey.Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace("_", string.Empty, StringComparison.Ordinal)
            .ToLowerInvariant();

        if (IsExplicitCredentialKey(normalized))
            return true;

        foreach (string fragment in SensitiveKeyFragments)
        {
            if (ContainsSensitiveFragment(normalized, fragment))
                return true;
        }

        return false;
    }

    private static bool ContainsSensitiveFragment(string normalized, string fragment)
    {
        int index = 0;

        while (index < normalized.Length)
        {
            index = normalized.IndexOf(fragment, index, StringComparison.Ordinal);

            if (index < 0)
                return false;

            if (!IsNegatedSensitiveFragment(normalized, index, fragment)
                && !IsEmbeddedSensitiveFragment(normalized, index))
                return true;

            index++;
        }

        return false;
    }

    private static bool IsExplicitCredentialKey(string normalized)
    {
        return normalized.Equals("sharedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("secondaryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("primaryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("accountsharedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("storageaccountkey", StringComparison.Ordinal)
            || normalized.Equals("blobaccesskey", StringComparison.Ordinal)
            || normalized.Equals("fileaccesskey", StringComparison.Ordinal)
            || normalized.Equals("queueaccesskey", StringComparison.Ordinal)
            || normalized.Equals("tableaccesskey", StringComparison.Ordinal)
            || normalized.Equals("diskaccesskey", StringComparison.Ordinal)
            || normalized.Equals("webaccesskey", StringComparison.Ordinal)
            || normalized.Equals("manageaccesskey", StringComparison.Ordinal)
            || normalized.Equals("dfsaccesskey", StringComparison.Ordinal)
            || normalized.Equals("cosmosaccesskey", StringComparison.Ordinal)
            || normalized.Equals("apiaccesskey", StringComparison.Ordinal)
            || normalized.Equals("datalakeaccesskey", StringComparison.Ordinal)
            || normalized.Equals("serviceaccesskey", StringComparison.Ordinal)
            || normalized.Equals("eventaccesskey", StringComparison.Ordinal)
            || normalized.Equals("portalaccesskey", StringComparison.Ordinal)
            || normalized.Equals("adminaccesskey", StringComparison.Ordinal)
            || normalized.Equals("sasaccesskey", StringComparison.Ordinal)
            || normalized.Equals("backupaccesskey", StringComparison.Ordinal)
            || normalized.Equals("masteraccesskey", StringComparison.Ordinal)
            || normalized.Equals("rootaccesskey", StringComparison.Ordinal)
            || normalized.Equals("accountaccesskey", StringComparison.Ordinal)
            || normalized.Equals("storageaccesskey", StringComparison.Ordinal)
            || normalized.Equals("keyaccesskey", StringComparison.Ordinal)
            || normalized.Equals("defaultaccesskey", StringComparison.Ordinal)
            || normalized.Equals("globalaccesskey", StringComparison.Ordinal)
            || normalized.Equals("sharedkeyaccesskey", StringComparison.Ordinal)
            || normalized.Equals("customaccesskey", StringComparison.Ordinal)
            || normalized.Equals("localaccesskey", StringComparison.Ordinal)
            || normalized.Equals("remoteaccesskey", StringComparison.Ordinal)
            || normalized.Equals("tempaccesskey", StringComparison.Ordinal)
            || normalized.Equals("temporaryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("externalaccesskey", StringComparison.Ordinal)
            || normalized.Equals("internalaccesskey", StringComparison.Ordinal)
            || normalized.Equals("primarystorageaccesskey", StringComparison.Ordinal)
            || normalized.Equals("secondarystorageaccesskey", StringComparison.Ordinal)
            || normalized.Equals("rotatedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("legacyaccesskey", StringComparison.Ordinal)
            || normalized.Equals("stagedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("connectoraccesskey", StringComparison.Ordinal)
            || normalized.Equals("deprecatedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("fallbackaccesskey", StringComparison.Ordinal)
            || normalized.Equals("integrationaccesskey", StringComparison.Ordinal)
            || normalized.Equals("migrationaccesskey", StringComparison.Ordinal)
            || normalized.Equals("partneraccesskey", StringComparison.Ordinal)
            || normalized.Equals("replicaaccesskey", StringComparison.Ordinal)
            || normalized.Equals("archiveaccesskey", StringComparison.Ordinal)
            || normalized.Equals("disasterrecoveryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("replicationaccesskey", StringComparison.Ordinal)
            || normalized.Equals("auditaccesskey", StringComparison.Ordinal)
            || normalized.Equals("automationaccesskey", StringComparison.Ordinal)
            || normalized.Equals("batchaccesskey", StringComparison.Ordinal)
            || normalized.Equals("bootstrapaccesskey", StringComparison.Ordinal)
            || normalized.Equals("brokeraccesskey", StringComparison.Ordinal)
            || normalized.Equals("bridgeaccesskey", StringComparison.Ordinal)
            || normalized.Equals("cacheaccesskey", StringComparison.Ordinal)
            || normalized.Equals("channelaccesskey", StringComparison.Ordinal)
            || normalized.Equals("clientaccesskey", StringComparison.Ordinal)
            || normalized.Equals("clusteraccesskey", StringComparison.Ordinal)
            || normalized.Equals("cloudaccesskey", StringComparison.Ordinal)
            || normalized.Equals("computeaccesskey", StringComparison.Ordinal)
            || normalized.Equals("configaccesskey", StringComparison.Ordinal)
            || normalized.Equals("connectionaccesskey", StringComparison.Ordinal)
            || normalized.Equals("containeraccesskey", StringComparison.Ordinal)
            || normalized.Equals("controlaccesskey", StringComparison.Ordinal)
            || normalized.Equals("coreaccesskey", StringComparison.Ordinal)
            || normalized.Equals("contentaccesskey", StringComparison.Ordinal)
            || normalized.Equals("copyaccesskey", StringComparison.Ordinal)
            || normalized.Equals("corporateaccesskey", StringComparison.Ordinal)
            || normalized.Equals("credentialaccesskey", StringComparison.Ordinal)
            || normalized.Equals("customeraccesskey", StringComparison.Ordinal)
            || normalized.Equals("crossaccesskey", StringComparison.Ordinal)
            || normalized.Equals("cryptoaccesskey", StringComparison.Ordinal)
            || normalized.Equals("dataaccesskey", StringComparison.Ordinal)
            || normalized.Equals("databaseaccesskey", StringComparison.Ordinal)
            || normalized.Equals("dedicatedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("deploymentaccesskey", StringComparison.Ordinal)
            || normalized.Equals("developeraccesskey", StringComparison.Ordinal)
            || normalized.Equals("deviceaccesskey", StringComparison.Ordinal)
            || normalized.Equals("directaccesskey", StringComparison.Ordinal)
            || normalized.Equals("digitalaccesskey", StringComparison.Ordinal)
            || normalized.Equals("directoryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("distributedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("documentaccesskey", StringComparison.Ordinal)
            || normalized.Equals("domainaccesskey", StringComparison.Ordinal)
            || normalized.Equals("drillaccesskey", StringComparison.Ordinal)
            || normalized.Equals("driveaccesskey", StringComparison.Ordinal)
            || normalized.Equals("dynamicaccesskey", StringComparison.Ordinal)
            || normalized.Equals("edgeaccesskey", StringComparison.Ordinal)
            || normalized.Equals("emailaccesskey", StringComparison.Ordinal)
            || normalized.Equals("embeddedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("emergencyaccesskey", StringComparison.Ordinal)
            || normalized.Equals("encryptionaccesskey", StringComparison.Ordinal)
            || normalized.Equals("enterpriseaccesskey", StringComparison.Ordinal)
            || normalized.Equals("entryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("environmentaccesskey", StringComparison.Ordinal)
            || normalized.Equals("exchangeaccesskey", StringComparison.Ordinal)
            || normalized.Equals("executionaccesskey", StringComparison.Ordinal)
            || normalized.Equals("exportaccesskey", StringComparison.Ordinal)
            || normalized.Equals("extensionaccesskey", StringComparison.Ordinal)
            || normalized.Equals("federatedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("fetchaccesskey", StringComparison.Ordinal)
            || normalized.Equals("filteraccesskey", StringComparison.Ordinal)
            || normalized.Equals("finalaccesskey", StringComparison.Ordinal)
            || normalized.Equals("financeaccesskey", StringComparison.Ordinal)
            || normalized.Equals("firewallaccesskey", StringComparison.Ordinal)
            || normalized.Equals("flagaccesskey", StringComparison.Ordinal)
            || normalized.Equals("fleetaccesskey", StringComparison.Ordinal)
            || normalized.Equals("flowaccesskey", StringComparison.Ordinal)
            || normalized.Equals("folderaccesskey", StringComparison.Ordinal)
            || normalized.Equals("forwardaccesskey", StringComparison.Ordinal)
            || normalized.Equals("foundationaccesskey", StringComparison.Ordinal)
            || normalized.Equals("frontaccesskey", StringComparison.Ordinal)
            || normalized.Equals("fullaccesskey", StringComparison.Ordinal)
            || normalized.Equals("gatewayaccesskey", StringComparison.Ordinal)
            || normalized.Equals("groupaccesskey", StringComparison.Ordinal)
            || normalized.Equals("guestaccesskey", StringComparison.Ordinal)
            || normalized.Equals("handleaccesskey", StringComparison.Ordinal)
            || normalized.Equals("hashaccesskey", StringComparison.Ordinal)
            || normalized.Equals("healthaccesskey", StringComparison.Ordinal)
            || normalized.Equals("hostaccesskey", StringComparison.Ordinal)
            || normalized.Equals("hubaccesskey", StringComparison.Ordinal)
            || normalized.Equals("hybridaccesskey", StringComparison.Ordinal)
            || normalized.Equals("identityaccesskey", StringComparison.Ordinal)
            || normalized.Equals("imageaccesskey", StringComparison.Ordinal)
            || normalized.Equals("importaccesskey", StringComparison.Ordinal)
            || normalized.Equals("indexaccesskey", StringComparison.Ordinal)
            || normalized.Equals("instanceaccesskey", StringComparison.Ordinal)
            || normalized.Equals("interactiveaccesskey", StringComparison.Ordinal)
            || normalized.Equals("inventoryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("invoiceaccesskey", StringComparison.Ordinal)
            || normalized.Equals("ioaccesskey", StringComparison.Ordinal)
            || normalized.Equals("issueraccesskey", StringComparison.Ordinal)
            || normalized.Equals("itemaccesskey", StringComparison.Ordinal)
            || normalized.Equals("jobaccesskey", StringComparison.Ordinal)
            || normalized.Equals("joinaccesskey", StringComparison.Ordinal)
            || normalized.Equals("journalaccesskey", StringComparison.Ordinal)
            || normalized.Equals("jsonaccesskey", StringComparison.Ordinal)
            || normalized.Equals("jumpaccesskey", StringComparison.Ordinal)
            || normalized.Equals("kernelaccesskey", StringComparison.Ordinal)
            || normalized.Equals("kafkaaccesskey", StringComparison.Ordinal)
            || normalized.Equals("keeperaccesskey", StringComparison.Ordinal)
            || normalized.Equals("labelaccesskey", StringComparison.Ordinal)
            || normalized.Equals("lambdaaccesskey", StringComparison.Ordinal)
            || normalized.Equals("layeraccesskey", StringComparison.Ordinal)
            || normalized.Equals("leadaccesskey", StringComparison.Ordinal)
            || normalized.Equals("leaseaccesskey", StringComparison.Ordinal)
            || normalized.Equals("libraryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("linkaccesskey", StringComparison.Ordinal)
            || normalized.Equals("liveaccesskey", StringComparison.Ordinal)
            || normalized.Equals("loadaccesskey", StringComparison.Ordinal)
            || normalized.Equals("lockaccesskey", StringComparison.Ordinal)
            || normalized.Equals("logaccesskey", StringComparison.Ordinal)
            || normalized.Equals("loginaccesskey", StringComparison.Ordinal)
            || normalized.Equals("longaccesskey", StringComparison.Ordinal)
            || normalized.Equals("lookupaccesskey", StringComparison.Ordinal)
            || normalized.Equals("loopaccesskey", StringComparison.Ordinal)
            || normalized.Equals("lowaccesskey", StringComparison.Ordinal)
            || normalized.Equals("machineaccesskey", StringComparison.Ordinal)
            || normalized.Equals("managedaccesskey", StringComparison.Ordinal)
            || normalized.Equals("mapaccesskey", StringComparison.Ordinal)
            || normalized.Equals("memberaccesskey", StringComparison.Ordinal)
            || normalized.Equals("memoryaccesskey", StringComparison.Ordinal)
            || normalized.Equals("mergeaccesskey", StringComparison.Ordinal)
            || normalized.Equals("messageaccesskey", StringComparison.Ordinal)
            || normalized.Equals("metricaccesskey", StringComparison.Ordinal)
            || normalized.Equals("signingkey", StringComparison.Ordinal)
            || normalized.Equals("signingcertificate", StringComparison.Ordinal)
            || normalized.Equals("signingcertificatepath", StringComparison.Ordinal);
    }

    private static bool IsNegatedSensitiveFragment(string normalized, int fragmentIndex, string fragment)
    {
        if (IsNonPrefixedNegation(normalized, fragmentIndex))
            return true;

        if (IsNoPrefixedNegation(normalized, fragmentIndex))
            return true;

        if (IsUnPrefixedNegation(normalized, fragmentIndex))
            return true;

        if (fragmentIndex == 0
            && normalized.Length > fragment.Length
            && (normalized.AsSpan(fragment.Length).StartsWith("less", StringComparison.Ordinal)
                || normalized.AsSpan(fragment.Length).StartsWith("free", StringComparison.Ordinal)
                || normalized.AsSpan(fragment.Length).StartsWith("izer", StringComparison.Ordinal)))
            return true;

        return false;
    }

    private static bool IsEmbeddedSensitiveFragment(string normalized, int fragmentIndex)
    {
        if (fragmentIndex > 0 && char.IsLetter(normalized[fragmentIndex - 1]))
            return true;

        return false;
    }

    private static bool IsNonPrefixedNegation(string normalized, int fragmentIndex)
    {
        ReadOnlySpan<char> before = normalized.AsSpan(0, fragmentIndex);

        if (before.Length < 3)
            return false;

        return before.EndsWith("non", StringComparison.Ordinal);
    }

    private static bool IsNoPrefixedNegation(string normalized, int fragmentIndex)
    {
        ReadOnlySpan<char> before = normalized.AsSpan(0, fragmentIndex);

        if (before.Length < 2)
            return false;

        return before.EndsWith("no", StringComparison.Ordinal);
    }

    private static bool IsUnPrefixedNegation(string normalized, int fragmentIndex)
    {
        ReadOnlySpan<char> before = normalized.AsSpan(0, fragmentIndex);

        if (before.Length < 2)
            return false;

        return before.EndsWith("un", StringComparison.Ordinal);
    }

    public static string RedactValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : "[REDACTED]";
}
