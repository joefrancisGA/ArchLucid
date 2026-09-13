using System.Text.Json;

using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.ContextIngestion.Infrastructure.Canonical;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Maps Kubernetes API objects (JSON) to <see cref="CanonicalObject" /> rows.
/// </summary>
internal static class KubernetesManifestCanonicalObjectMapper
{
    internal static IReadOnlyList<CanonicalObject> MapDocuments(
        IReadOnlyList<JsonElement> documents,
        InfrastructureDeclarationReference declaration)
    {
        ArgumentNullException.ThrowIfNull(declaration);

        List<CanonicalObject> results = [];
        Dictionary<string, int> labelTotals = CountManifestLabelOccurrences(documents);
        Dictionary<string, int> labelSeen = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement document in documents)
        {
            if (document.ValueKind is not JsonValueKind.Object)
                continue;

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(document, "kind", out JsonElement kindElement)
                && string.Equals(kindElement.GetString(), "List", StringComparison.OrdinalIgnoreCase)
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(document, "items", out JsonElement items)
                && items.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement item in items.EnumerateArray())
                    TryAddResource(item, declaration, results, labelTotals, labelSeen);

                continue;
            }

            TryAddResource(document, declaration, results, labelTotals, labelSeen);
        }

        return results;
    }

    private static Dictionary<string, int> CountManifestLabelOccurrences(IReadOnlyList<JsonElement> documents)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement document in documents)
            CountManifestLabelOccurrences(document, counts);

        return counts;
    }

    private static void CountManifestLabelOccurrences(JsonElement document, Dictionary<string, int> counts)
    {
        if (document.ValueKind is not JsonValueKind.Object)
            return;

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(document, "kind", out JsonElement kindElement)
            && string.Equals(kindElement.GetString(), "List", StringComparison.OrdinalIgnoreCase)
            && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(document, "items", out JsonElement items)
            && items.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement item in items.EnumerateArray())
                IncrementManifestLabelCount(item, counts);

            return;
        }

        IncrementManifestLabelCount(document, counts);
    }

    private static void IncrementManifestLabelCount(JsonElement resource, Dictionary<string, int> counts)
    {
        if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(resource, "kind", out JsonElement kindElement) || kindElement.ValueKind is not JsonValueKind.String)
            return;

        string kind = (kindElement.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(kind))
            return;

        string namespaceValue = CanonicalInfrastructureJsonElementReader.ReadMetadataString(resource, "metadata", "namespace") ?? string.Empty;
        string name = CanonicalInfrastructureJsonElementReader.ReadMetadataString(resource, "metadata", "name") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
            return;

        string canonicalName = string.IsNullOrWhiteSpace(namespaceValue)
            ? name.ToLowerInvariant()
            : $"{namespaceValue.ToLowerInvariant()}/{name.ToLowerInvariant()}";

        string labelKey = $"{kind.ToLowerInvariant()}|{canonicalName}";
        counts[labelKey] = counts.GetValueOrDefault(labelKey) + 1;
    }

    private static void TryAddResource(
        JsonElement resource,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        IReadOnlyDictionary<string, int> labelTotals,
        Dictionary<string, int> labelSeen)
    {
        if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(resource, "kind", out JsonElement kindElement) || kindElement.ValueKind is not JsonValueKind.String)
            return;

        string kind = (kindElement.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(kind))
            return;

        string apiVersion = CanonicalInfrastructureJsonElementReader.ReadTopLevelStringIgnoreCaseOrSnakeCase(resource, "apiVersion") ?? string.Empty;
        string namespaceValue = CanonicalInfrastructureJsonElementReader.ReadMetadataString(resource, "metadata", "namespace") ?? string.Empty;
        string name = CanonicalInfrastructureJsonElementReader.ReadMetadataString(resource, "metadata", "name") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
            return;

        string canonicalName = string.IsNullOrWhiteSpace(namespaceValue)
            ? name.ToLowerInvariant()
            : $"{namespaceValue.ToLowerInvariant()}/{name.ToLowerInvariant()}";

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["k8s.kind"] = kind.ToLowerInvariant(),
            ["k8s.apiVersion"] = apiVersion.ToLowerInvariant(),
            ["k8s.name"] = name.ToLowerInvariant(),
        };

        if (!string.IsNullOrWhiteSpace(namespaceValue))
            properties["k8s.namespace"] = namespaceValue.ToLowerInvariant();

        string objectType = ResolveObjectType(kind);
        string labelKey = $"{kind.ToLowerInvariant()}|{canonicalName}";
        string stableIdentity = CanonicalInfrastructureObjectMapper.BuildOccurrenceAwareStableIdentity(
            labelKey,
            labelTotals,
            labelSeen,
            properties,
            "k8sOccurrence");

        string stableObjectId = CanonicalInfrastructureObjectMapper.BuildStableObjectId(objectType, declaration, stableIdentity);

        if (string.Equals(kind, "Secret", StringComparison.OrdinalIgnoreCase))
        {
            properties["status"] = "declared";

            results.Add(new CanonicalObject
            {
                ObjectId = stableObjectId,
                ObjectType = objectType,
                Name = canonicalName,
                SourceType = "InfrastructureDeclaration",
                SourceId = declaration.DeclarationId,
                Properties = properties
            });

            return;
        }

        ProjectSecuritySpecFields(resource, kind, properties);

        results.Add(new CanonicalObject
        {
            ObjectId = stableObjectId,
            ObjectType = objectType,
            Name = canonicalName,
            SourceType = "InfrastructureDeclaration",
            SourceId = declaration.DeclarationId,
            Properties = properties
        });
    }

    private static void ProjectSecuritySpecFields(
        JsonElement resource,
        string kind,
        Dictionary<string, string> properties)
    {
        if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(resource, "spec", out JsonElement specElement)
            || specElement.ValueKind is not JsonValueKind.Object)
            return;

        if (string.Equals(kind, "Service", StringComparison.OrdinalIgnoreCase))
        {
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(specElement, "type", out JsonElement typeElement)
                && typeElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(typeElement.GetString()))
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "serviceType", typeElement.GetString()!);

            return;
        }

        if (string.Equals(kind, "NetworkPolicy", StringComparison.OrdinalIgnoreCase))
        {
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(specElement, "ingress", out JsonElement ingress)
                && ingress.ValueKind is JsonValueKind.Array
                && ingress.GetArrayLength() > 0)
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "networkPolicyIngress", "true");

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(specElement, "egress", out JsonElement egress)
                && egress.ValueKind is JsonValueKind.Array
                && egress.GetArrayLength() > 0)
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "networkPolicyEgress", "true");

            return;
        }

        JsonElement podSpec = ResolvePodSpec(specElement, kind);

        if (podSpec.ValueKind is not JsonValueKind.Object)
            return;

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "hostNetwork", out JsonElement hostNetwork)
            && hostNetwork.ValueKind is JsonValueKind.True)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "hostNetwork", "true");

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "hostPid", out JsonElement hostPid)
            && hostPid.ValueKind is JsonValueKind.True)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "hostPID", "true");

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "hostIpc", out JsonElement hostIpc)
            && hostIpc.ValueKind is JsonValueKind.True)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "hostIPC", "true");

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "shareProcessNamespace", out JsonElement shareProcessNamespace)
            && shareProcessNamespace.ValueKind is JsonValueKind.True)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "shareProcessNamespace", "true");

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "hostUsers", out JsonElement hostUsers)
            && hostUsers.ValueKind is JsonValueKind.True)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "hostUsers", "true");

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "enableServiceLinks", out JsonElement enableServiceLinks)
            && enableServiceLinks.ValueKind is JsonValueKind.False)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "enableServiceLinks", "false");

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "automountServiceAccountToken", out JsonElement automountServiceAccountToken)
            && automountServiceAccountToken.ValueKind is JsonValueKind.False)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "automountServiceAccountToken", "false");

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "dnsPolicy", out JsonElement dnsPolicy)
            && dnsPolicy.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(dnsPolicy.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsPolicy", dnsPolicy.GetString()!);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "serviceAccountName", out JsonElement serviceAccountName)
            && serviceAccountName.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(serviceAccountName.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "serviceAccountName", serviceAccountName.GetString()!);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "priorityClassName", out JsonElement priorityClassName)
            && priorityClassName.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(priorityClassName.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "priorityClassName", priorityClassName.GetString()!);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "runtimeClassName", out JsonElement runtimeClassName)
            && runtimeClassName.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(runtimeClassName.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "runtimeClassName", runtimeClassName.GetString()!);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "hostname", out JsonElement hostname)
            && hostname.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(hostname.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "hostname", hostname.GetString()!);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "subdomain", out JsonElement subdomain)
            && subdomain.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(subdomain.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "subdomain", subdomain.GetString()!);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "restartPolicy", out JsonElement restartPolicy)
            && restartPolicy.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(restartPolicy.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "restartPolicy", restartPolicy.GetString()!);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "nodeName", out JsonElement nodeName)
            && nodeName.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(nodeName.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "nodeName", nodeName.GetString()!);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "schedulerName", out JsonElement schedulerName)
            && schedulerName.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(schedulerName.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "schedulerName", schedulerName.GetString()!);

        if (TryGetSetHostnameAsFqdn(podSpec, out JsonElement setHostnameAsFqdn)
            && setHostnameAsFqdn.ValueKind is JsonValueKind.True)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "setHostnameAsFQDN", "true");

        if (TryGetTerminationGracePeriodSeconds(podSpec, out JsonElement terminationGracePeriodSeconds)
            && terminationGracePeriodSeconds.ValueKind is JsonValueKind.Number
            && terminationGracePeriodSeconds.TryGetInt64(out long graceSeconds))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "terminationGracePeriodSeconds", graceSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture));

        if (TryGetActiveDeadlineSeconds(podSpec, out JsonElement activeDeadlineSeconds)
            && activeDeadlineSeconds.ValueKind is JsonValueKind.Number
            && activeDeadlineSeconds.TryGetInt64(out long deadlineSeconds))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "activeDeadlineSeconds", deadlineSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture));

        if (TryGetPreemptionPolicy(podSpec, out JsonElement preemptionPolicy)
            && preemptionPolicy.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(preemptionPolicy.GetString()))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "preemptionPolicy", preemptionPolicy.GetString()!);

        ProjectContainerSecurityContext(podSpec, properties);
    }

    private static bool TryGetSetHostnameAsFqdn(JsonElement podSpec, out JsonElement value)
    {
        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "setHostnameAsFQDN", out value))
            return true;

        return CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(podSpec, "set_hostname_as_fqdn", out value);
    }

    private static bool TryGetTerminationGracePeriodSeconds(JsonElement podSpec, out JsonElement value)
    {
        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "terminationGracePeriodSeconds", out value))
            return true;

        return CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(podSpec, "termination_grace_period_seconds", out value);
    }

    private static bool TryGetActiveDeadlineSeconds(JsonElement podSpec, out JsonElement value)
    {
        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "activeDeadlineSeconds", out value))
            return true;

        return CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(podSpec, "active_deadline_seconds", out value);
    }

    private static bool TryGetPreemptionPolicy(JsonElement podSpec, out JsonElement value)
    {
        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "preemptionPolicy", out value))
            return true;

        return CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(podSpec, "preemption_policy", out value);
    }

    private static JsonElement ResolvePodSpec(JsonElement specElement, string kind)
    {
        if (string.Equals(kind, "Pod", StringComparison.OrdinalIgnoreCase))
            return specElement;

        if (string.Equals(kind, "CronJob", StringComparison.OrdinalIgnoreCase))
        {
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(specElement, "jobTemplate", out JsonElement jobTemplate)
                && jobTemplate.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(jobTemplate, "spec", out JsonElement cronJobSpec)
                && cronJobSpec.ValueKind is JsonValueKind.Object
                && TryGetWorkloadPodTemplate(cronJobSpec, out JsonElement cronJobPodTemplate)
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(cronJobPodTemplate, "spec", out JsonElement cronJobPodSpec))
                return cronJobPodSpec;

            return default;
        }

        if (TryGetWorkloadPodTemplate(specElement, out JsonElement workloadTemplate)
            && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(workloadTemplate, "spec", out JsonElement workloadPodSpec))
            return workloadPodSpec;

        return default;
    }

    private static bool TryGetWorkloadPodTemplate(JsonElement specElement, out JsonElement podTemplate)
    {
        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(specElement, "template", out podTemplate)
            && podTemplate.ValueKind is JsonValueKind.Object)
            return true;

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(specElement, "podTemplate", out podTemplate)
            && podTemplate.ValueKind is JsonValueKind.Object)
            return true;

        podTemplate = default;

        return false;
    }

    private static void ProjectContainerSecurityContext(JsonElement podSpec, Dictionary<string, string> properties)
    {
        bool privileged = false;
        bool allowPrivilegeEscalation = false;
        bool sawRunAsNonRoot = false;
        bool allRunAsNonRootTrue = true;
        bool anyRunAsNonRootFalse = false;

        void InspectSecurityContext(JsonElement securityContext)
        {
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(securityContext, "privileged", out JsonElement privilegedElement)
                && privilegedElement.ValueKind is JsonValueKind.True)
                privileged = true;

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "allowPrivilegeEscalation", out JsonElement escalationElement)
                && escalationElement.ValueKind is JsonValueKind.True)
                allowPrivilegeEscalation = true;

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "runAsNonRoot", out JsonElement runAsNonRootElement))
            {
                sawRunAsNonRoot = true;

                if (runAsNonRootElement.ValueKind is JsonValueKind.True)
                    allRunAsNonRootTrue = allRunAsNonRootTrue && true;
                else if (runAsNonRootElement.ValueKind is JsonValueKind.False)
                    anyRunAsNonRootFalse = true;
            }
        }

        void InspectContainer(JsonElement container)
        {
            if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "securityContext", out JsonElement securityContext)
                || securityContext.ValueKind is not JsonValueKind.Object)
                return;

            InspectSecurityContext(securityContext);
        }

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "securityContext", out JsonElement podSecurityContext)
            && podSecurityContext.ValueKind is JsonValueKind.Object)
            InspectSecurityContext(podSecurityContext);

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(podSpec, "containers", out JsonElement containers)
            && containers.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement container in containers.EnumerateArray())
                InspectContainer(container);
        }

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "initContainers", out JsonElement initContainers)
            && initContainers.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement container in initContainers.EnumerateArray())
                InspectContainer(container);
        }

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "ephemeralContainers", out JsonElement ephemeralContainers)
            && ephemeralContainers.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement container in ephemeralContainers.EnumerateArray())
                InspectContainer(container);
        }

        if (privileged)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "privileged", "true");

        if (allowPrivilegeEscalation)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "allowPrivilegeEscalation", "true");

        if (sawRunAsNonRoot && anyRunAsNonRootFalse)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "runAsNonRoot", "false");
        else if (sawRunAsNonRoot && allRunAsNonRootTrue)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "runAsNonRoot", "true");
    }

    private static string ResolveObjectType(string kind)
    {
        return kind.ToLowerInvariant() switch
        {
            "networkpolicy" or "role" or "clusterrole" or "rolebinding" or "clusterrolebinding"
                or "serviceaccount" or "ingress" or "secret" => "SecurityBaseline",
            _ => "TopologyResource",
        };
    }
}
