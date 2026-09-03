namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationPremiseConflictClassifier
{
    private static readonly string[] WorkloadIsolationIntentPhrases = ["restricted workload","no privileged","pod security","restricted pss","restricted pod security","non-root","run as non-root","host network"];
    private static bool WorkloadIsolationIntentMatches(string n) => ContainsAnyPhrase(n, WorkloadIsolationIntentPhrases);
    private static bool TryGetWorkloadIsolationDeclarationProperty(IReadOnlyDictionary<string, string> properties, out string? propertyKey, out string? propertyValue)
    {
        propertyKey = null; propertyValue = null;
        if (TryGetK8sProperty(properties, "privileged", out propertyValue)) { propertyKey = "k8s.privileged"; return true; }
        if (TryGetK8sProperty(properties, "hostNetwork", out propertyValue)) { propertyKey = "k8s.hostNetwork"; return true; }
        if (TryGetK8sProperty(properties, "allowPrivilegeEscalation", out propertyValue)) { propertyKey = "k8s.allowPrivilegeEscalation"; return true; }
        return false;
    }
}
