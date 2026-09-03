namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationSecurityBaselineClassifier
{
    private static bool IsPrivilegedWorkload(IReadOnlyDictionary<string, string> properties) =>
        TryGetK8sTruthy(properties, "privileged");

    private static bool IsHostNetworkWorkload(IReadOnlyDictionary<string, string> properties) =>
        TryGetK8sTruthy(properties, "hostNetwork");

    private static bool AllowsPrivilegeEscalation(IReadOnlyDictionary<string, string> properties) =>
        TryGetK8sTruthy(properties, "allowPrivilegeEscalation");

    private static bool TryGetK8sTruthy(IReadOnlyDictionary<string, string> properties, string keySuffix)
    {
        if (!TryGetProperty(properties, $"k8s.{keySuffix}", out string? value))
            return false;

        return IsTruthy(value);
    }
}
