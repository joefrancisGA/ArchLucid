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

        if (TryGetPriority(podSpec, out JsonElement priority)
            && priority.ValueKind is JsonValueKind.Number
            && priority.TryGetInt32(out int priorityValue))
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "priority", priorityValue.ToString(System.Globalization.CultureInfo.InvariantCulture));

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "nodeSelector", out JsonElement nodeSelector)
            && nodeSelector.ValueKind is JsonValueKind.Object)
        {
            foreach (JsonProperty selector in nodeSelector.EnumerateObject())
            {
                if (selector.Value.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(selector.Value.GetString()))
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        $"nodeSelector.{selector.Name}",
                        selector.Value.GetString()!);
                }
            }
        }

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "imagePullSecrets", out JsonElement imagePullSecrets)
            && imagePullSecrets.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement secret in imagePullSecrets.EnumerateArray())
            {
                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(secret, "name", out JsonElement secretName)
                    && secretName.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(secretName.GetString()))
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "imagePullSecret", secretName.GetString()!);
                    break;
                }
            }
        }

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "dnsConfig", out JsonElement dnsConfig)
            && dnsConfig.ValueKind is JsonValueKind.Object)
        {
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "nameservers", out JsonElement nameservers)
                && nameservers.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement nameserver in nameservers.EnumerateArray())
                {
                    if (nameserver.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(nameserver.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsNameserver", nameserver.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "searches", out JsonElement searches)
                && searches.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement search in searches.EnumerateArray())
                {
                    if (search.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(search.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsSearch", search.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptions)
                && dnsOptions.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptions.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "ndots", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionNdots", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsSingleRequest)
                && dnsOptionsSingleRequest.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsSingleRequest.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "single-request", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionSingleRequest", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsAttempts)
                && dnsOptionsAttempts.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsAttempts.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "attempts", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionAttempts", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsTimeout)
                && dnsOptionsTimeout.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsTimeout.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "timeout", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionTimeout", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsRotate)
                && dnsOptionsRotate.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsRotate.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "rotate", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionRotate", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsUseVc)
                && dnsOptionsUseVc.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsUseVc.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "use-vc", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionUseVc", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsSingleRequestReopen)
                && dnsOptionsSingleRequestReopen.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsSingleRequestReopen.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "single-request-reopen", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionSingleRequestReopen", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsEdns0)
                && dnsOptionsEdns0.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsEdns0.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "edns0", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionEdns0", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsNoTldQuery)
                && dnsOptionsNoTldQuery.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsNoTldQuery.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "no-tld-query", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionNoTldQuery", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsTrustAd)
                && dnsOptionsTrustAd.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsTrustAd.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "trust-ad", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionTrustAd", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsDebug)
                && dnsOptionsDebug.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsDebug.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "debug", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionDebug", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsInet6)
                && dnsOptionsInet6.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsInet6.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "inet6", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionInet6", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsIp6Dotint)
                && dnsOptionsIp6Dotint.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsIp6Dotint.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "ip6-dotint", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionIp6Dotint", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsIp6Bytestring)
                && dnsOptionsIp6Bytestring.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsIp6Bytestring.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "ip6-bytestring", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionIp6Bytestring", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsNoAaaa)
                && dnsOptionsNoAaaa.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsNoAaaa.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "no-aaaa", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionNoAaaa", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsIp6Nobind)
                && dnsOptionsIp6Nobind.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsIp6Nobind.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "ip6-nobind", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionIp6Nobind", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsNoReload)
                && dnsOptionsNoReload.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsNoReload.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "no-reload", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionNoReload", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsNoglue)
                && dnsOptionsNoglue.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsNoglue.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "noglue", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionNoglue", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsNoCheckNames)
                && dnsOptionsNoCheckNames.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsNoCheckNames.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "no-check-names", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionNoCheckNames", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsLocalise)
                && dnsOptionsLocalise.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsLocalise.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "localise", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionLocalise", optionValue.GetString()!);
                        break;
                    }
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsConfig, "options", out JsonElement dnsOptionsIp6Arpa)
                && dnsOptionsIp6Arpa.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement dnsOption in dnsOptionsIp6Arpa.EnumerateArray())
                {
                    if (dnsOption.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "name", out JsonElement optionName)
                        || optionName.ValueKind is not JsonValueKind.String
                        || !string.Equals(optionName.GetString(), "ip6-arpa", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(dnsOption, "value", out JsonElement optionValue)
                        && optionValue.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(optionValue.GetString()))
                    {
                        CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "dnsOptionIp6Arpa", optionValue.GetString()!);
                        break;
                    }
                }
            }
        }

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "hostAliases", out JsonElement hostAliases)
            && hostAliases.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement hostAlias in hostAliases.EnumerateArray())
            {
                if (hostAlias.ValueKind is not JsonValueKind.Object)
                    continue;

                bool hostAliasProjected = false;

                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(hostAlias, "ip", out JsonElement aliasIp)
                    && aliasIp.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(aliasIp.GetString()))
                {
                    hostAliasProjected = CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "hostAliasIp", aliasIp.GetString()!);
                }

                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(hostAlias, "hostnames", out JsonElement hostnames)
                    && hostnames.ValueKind is JsonValueKind.Array)
                {
                    foreach (JsonElement aliasHostname in hostnames.EnumerateArray())
                    {
                        if (aliasHostname.ValueKind is JsonValueKind.String
                            && !string.IsNullOrWhiteSpace(aliasHostname.GetString()))
                        {
                            hostAliasProjected = CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "hostAliasHostname", aliasHostname.GetString()!)
                                || hostAliasProjected;
                            break;
                        }
                    }
                }

                if (hostAliasProjected)
                    break;
            }
        }

        if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "readinessGates", out JsonElement readinessGates)
            && readinessGates.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement readinessGate in readinessGates.EnumerateArray())
            {
                if (readinessGate.ValueKind is not JsonValueKind.Object)
                    continue;

                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(readinessGate, "conditionType", out JsonElement conditionType)
                    && conditionType.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(conditionType.GetString()))
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "readinessGate", conditionType.GetString()!);
                    break;
                }
            }
        }

        ProjectContainerSecurityContext(podSpec, properties);    }

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

    private static bool TryGetPriority(JsonElement podSpec, out JsonElement value) =>
        CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(podSpec, "priority", out value);

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

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "readOnlyRootFilesystem", out JsonElement readOnlyRootFilesystemElement)
                && readOnlyRootFilesystemElement.ValueKind is JsonValueKind.True)
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "readOnlyRootFilesystem", "true");
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "runAsUser", out JsonElement runAsUserElement)
                && runAsUserElement.ValueKind is JsonValueKind.Number
                && runAsUserElement.TryGetInt64(out long runAsUserValue))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "runAsUser", runAsUserValue.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "runAsGroup", out JsonElement runAsGroupElement)
                && runAsGroupElement.ValueKind is JsonValueKind.Number
                && runAsGroupElement.TryGetInt64(out long runAsGroupValue))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "runAsGroup", runAsGroupValue.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "fsGroup", out JsonElement fsGroupElement)
                && fsGroupElement.ValueKind is JsonValueKind.Number
                && fsGroupElement.TryGetInt64(out long fsGroupValue))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "fsGroup", fsGroupValue.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "fsGroupChangePolicy", out JsonElement fsGroupChangePolicyElement)
                && fsGroupChangePolicyElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(fsGroupChangePolicyElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "fsGroupChangePolicy",
                    fsGroupChangePolicyElement.GetString()!);
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "seLinuxOptions", out JsonElement seLinuxOptionsElement)
                && seLinuxOptionsElement.ValueKind is JsonValueKind.Object)
            {
                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(seLinuxOptionsElement, "level", out JsonElement seLinuxLevelElement)
                    && seLinuxLevelElement.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(seLinuxLevelElement.GetString()))
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "seLinuxLevel",
                        seLinuxLevelElement.GetString()!);
                }

                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(seLinuxOptionsElement, "user", out JsonElement seLinuxUserElement)
                    && seLinuxUserElement.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(seLinuxUserElement.GetString()))
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "seLinuxUser",
                        seLinuxUserElement.GetString()!);
                }

                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(seLinuxOptionsElement, "role", out JsonElement seLinuxRoleElement)
                    && seLinuxRoleElement.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(seLinuxRoleElement.GetString()))
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "seLinuxRole",
                        seLinuxRoleElement.GetString()!);
                }

                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(seLinuxOptionsElement, "type", out JsonElement seLinuxTypeElement)
                    && seLinuxTypeElement.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(seLinuxTypeElement.GetString()))
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "seLinuxType",
                        seLinuxTypeElement.GetString()!);
                }

                if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(seLinuxOptionsElement, "mount", out JsonElement seLinuxMountElement)
                    && seLinuxMountElement.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(seLinuxMountElement.GetString()))
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "seLinuxMount",
                        seLinuxMountElement.GetString()!);
                }
            }


            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "seccompProfile", out JsonElement seccompProfileElement)
                && seccompProfileElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(seccompProfileElement, "type", out JsonElement seccompTypeElement)
                && seccompTypeElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(seccompTypeElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "seccompProfileType",
                    seccompTypeElement.GetString()!);
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "seccompProfile", out JsonElement seccompProfileForLocalhostElement)
                && seccompProfileForLocalhostElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(seccompProfileForLocalhostElement, "localhostProfile", out JsonElement seccompLocalhostElement)
                && seccompLocalhostElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(seccompLocalhostElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "seccompProfileLocalhostProfile",
                    seccompLocalhostElement.GetString()!);
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "seccompProfile", out JsonElement seccompProfileForDefaultActionElement)
                && seccompProfileForDefaultActionElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(seccompProfileForDefaultActionElement, "defaultAction", out JsonElement seccompDefaultActionElement)
                && seccompDefaultActionElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(seccompDefaultActionElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "seccompProfileDefaultAction",
                    seccompDefaultActionElement.GetString()!);
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "windowsOptions", out JsonElement windowsOptionsElement)
                && windowsOptionsElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(windowsOptionsElement, "hostProcess", out JsonElement hostProcessElement)
                && hostProcessElement.ValueKind is JsonValueKind.True)
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "windowsOptionsHostProcess", "true");
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "windowsOptions", out JsonElement windowsOptionsForRunAsUserNameElement)
                && windowsOptionsForRunAsUserNameElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(windowsOptionsForRunAsUserNameElement, "runAsUserName", out JsonElement runAsUserNameElement)
                && runAsUserNameElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(runAsUserNameElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "windowsOptionsRunAsUserName",
                    runAsUserNameElement.GetString()!);
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "windowsOptions", out JsonElement windowsOptionsForGmsaNameElement)
                && windowsOptionsForGmsaNameElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(windowsOptionsForGmsaNameElement, "gmsaCredentialSpecName", out JsonElement gmsaCredentialSpecNameElement)
                && gmsaCredentialSpecNameElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(gmsaCredentialSpecNameElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "windowsOptionsGmsaCredentialSpecName",
                    gmsaCredentialSpecNameElement.GetString()!);
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "windowsOptions", out JsonElement windowsOptionsForGmsaSpecElement)
                && windowsOptionsForGmsaSpecElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(windowsOptionsForGmsaSpecElement, "gmsaCredentialSpec", out JsonElement gmsaCredentialSpecElement)
                && gmsaCredentialSpecElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(gmsaCredentialSpecElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "windowsOptionsGmsaCredentialSpec",
                    gmsaCredentialSpecElement.GetString()!);
            }


            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "appArmorProfile", out JsonElement appArmorProfileElement)
                && appArmorProfileElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(appArmorProfileElement, "type", out JsonElement appArmorTypeElement)
                && appArmorTypeElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(appArmorTypeElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "appArmorProfileType",
                    appArmorTypeElement.GetString()!);
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "appArmorProfile", out JsonElement appArmorProfileForLocalhostElement)
                && appArmorProfileForLocalhostElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(appArmorProfileForLocalhostElement, "localhostProfile", out JsonElement appArmorLocalhostElement)
                && appArmorLocalhostElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(appArmorLocalhostElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "appArmorProfileLocalhostProfile",
                    appArmorLocalhostElement.GetString()!);
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "capabilities", out JsonElement capabilitiesElement)
                && capabilitiesElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(capabilitiesElement, "add", out JsonElement capabilitiesAddElement)
                && capabilitiesAddElement.ValueKind is JsonValueKind.Array)
            {
                List<string> capabilityAddValues = [];

                foreach (JsonElement capability in capabilitiesAddElement.EnumerateArray())
                {
                    if (capability.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(capability.GetString()))
                    {
                        capabilityAddValues.Add(capability.GetString()!);
                    }
                }

                if (capabilityAddValues.Count > 0)
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "capabilitiesAdd",
                        string.Join(',', capabilityAddValues));
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "capabilities", out JsonElement capabilitiesDropParentElement)
                && capabilitiesDropParentElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(capabilitiesDropParentElement, "drop", out JsonElement capabilitiesDropElement)
                && capabilitiesDropElement.ValueKind is JsonValueKind.Array)
            {
                List<string> capabilityDropValues = [];

                foreach (JsonElement capability in capabilitiesDropElement.EnumerateArray())
                {
                    if (capability.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(capability.GetString()))
                    {
                        capabilityDropValues.Add(capability.GetString()!);
                    }
                }

                if (capabilityDropValues.Count > 0)
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "capabilitiesDrop",
                        string.Join(',', capabilityDropValues));
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "sysctls", out JsonElement sysctlsElement)
                && sysctlsElement.ValueKind is JsonValueKind.Array)
            {
                List<string> sysctlValues = [];

                foreach (JsonElement sysctl in sysctlsElement.EnumerateArray())
                {
                    if (sysctl.ValueKind is not JsonValueKind.Object)
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(sysctl, "name", out JsonElement sysctlNameElement)
                        || sysctlNameElement.ValueKind is not JsonValueKind.String
                        || string.IsNullOrWhiteSpace(sysctlNameElement.GetString()))
                        continue;

                    if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(sysctl, "value", out JsonElement sysctlValueElement)
                        || sysctlValueElement.ValueKind is not JsonValueKind.String
                        || string.IsNullOrWhiteSpace(sysctlValueElement.GetString()))
                        continue;

                    sysctlValues.Add($"{sysctlNameElement.GetString()}={sysctlValueElement.GetString()}");
                }

                if (sysctlValues.Count > 0)
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "sysctls",
                        string.Join(',', sysctlValues));
                }
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "supplementalGroups", out JsonElement supplementalGroupsElement)
                && supplementalGroupsElement.ValueKind is JsonValueKind.Array)
            {
                List<string> supplementalGroupValues = [];

                foreach (JsonElement supplementalGroup in supplementalGroupsElement.EnumerateArray())
                {
                    if (supplementalGroup.ValueKind is JsonValueKind.Number
                        && supplementalGroup.TryGetInt64(out long supplementalGroupValue))
                    {
                        supplementalGroupValues.Add(supplementalGroupValue.ToString(System.Globalization.CultureInfo.InvariantCulture));
                    }
                }

                if (supplementalGroupValues.Count > 0)
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "supplementalGroups",
                        string.Join(',', supplementalGroupValues));
                }
            }

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
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "stdin", out JsonElement stdinElement)
                && stdinElement.ValueKind is JsonValueKind.True)
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "stdin", "true");
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "tty", out JsonElement ttyElement)
                && ttyElement.ValueKind is JsonValueKind.True)
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "tty", "true");
            }


            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "workingDir", out JsonElement workingDirElement)
                && workingDirElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(workingDirElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "workingDir",
                    workingDirElement.GetString()!);
            }


            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "stdinOnce", out JsonElement stdinOnceElement)
                && stdinOnceElement.ValueKind is JsonValueKind.True)
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "stdinOnce", "true");
            }

            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "terminationMessagePath", out JsonElement terminationMessagePathElement)
                && terminationMessagePathElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(terminationMessagePathElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "terminationMessagePath",
                    terminationMessagePathElement.GetString()!);
            }


            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "terminationMessagePolicy", out JsonElement terminationMessagePolicyElement)
                && terminationMessagePolicyElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(terminationMessagePolicyElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "terminationMessagePolicy",
                    terminationMessagePolicyElement.GetString()!);
            }


            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "imagePullPolicy", out JsonElement imagePullPolicyElement)
                && imagePullPolicyElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(imagePullPolicyElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "imagePullPolicy",
                    imagePullPolicyElement.GetString()!);
            }


            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "command", out JsonElement commandElement)
                && commandElement.ValueKind is JsonValueKind.Array)
            {
                List<string> commandValues = [];
                foreach (JsonElement commandPart in commandElement.EnumerateArray())
                {
                    if (commandPart.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(commandPart.GetString()))
                    {
                        commandValues.Add(commandPart.GetString()!);
                    }
                }

                if (commandValues.Count > 0)
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "command",
                        string.Join(',', commandValues));
                }
            }


            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(container, "args", out JsonElement argsElement)
                && argsElement.ValueKind is JsonValueKind.Array)
            {
                List<string> argValues = [];
                foreach (JsonElement argPart in argsElement.EnumerateArray())
                {
                    if (argPart.ValueKind is JsonValueKind.String
                        && !string.IsNullOrWhiteSpace(argPart.GetString()))
                    {
                        argValues.Add(argPart.GetString()!);
                    }
                }

                if (argValues.Count > 0)
                {
                    CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                        properties,
                        "args",
                        string.Join(',', argValues));
                }
            }

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
