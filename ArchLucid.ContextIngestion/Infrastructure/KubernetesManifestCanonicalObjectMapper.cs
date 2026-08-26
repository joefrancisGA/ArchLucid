using System.Text.Json;

using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;

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

        foreach (JsonElement document in documents)
        {
            if (document.ValueKind is not JsonValueKind.Object)
                continue;

            if (TryGetPropertyIgnoreCase(document, "kind", out JsonElement kindElement)
                && string.Equals(kindElement.GetString(), "List", StringComparison.OrdinalIgnoreCase)
                && TryGetPropertyIgnoreCase(document, "items", out JsonElement items)
                && items.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement item in items.EnumerateArray())
                    TryAddResource(item, declaration, results);

                continue;
            }

            TryAddResource(document, declaration, results);
        }

        return results;
    }

    private static void TryAddResource(
        JsonElement resource,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results)
    {
        if (!TryGetPropertyIgnoreCase(resource, "kind", out JsonElement kindElement) || kindElement.ValueKind is not JsonValueKind.String)
            return;

        string kind = (kindElement.GetString() ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(kind))
            return;

        string apiVersion = ReadTopLevelString(resource, "apiVersion") ?? string.Empty;
        string namespaceValue = ReadMetadataString(resource, "metadata", "namespace") ?? string.Empty;
        string name = ReadMetadataString(resource, "metadata", "name") ?? string.Empty;

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
        string stableObjectId = BuildStableObjectId(objectType, declaration, kind, canonicalName);

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
        if (!TryGetPropertyIgnoreCase(resource, "spec", out JsonElement specElement)
            || specElement.ValueKind is not JsonValueKind.Object)
            return;

        if (string.Equals(kind, "Service", StringComparison.OrdinalIgnoreCase))
        {
            if (TryGetPropertyIgnoreCase(specElement, "type", out JsonElement typeElement)
                && typeElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(typeElement.GetString()))
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "serviceType", typeElement.GetString()!);

            return;
        }

        if (string.Equals(kind, "NetworkPolicy", StringComparison.OrdinalIgnoreCase))
        {
            if (TryGetPropertyIgnoreCase(specElement, "ingress", out JsonElement ingress)
                && ingress.ValueKind is JsonValueKind.Array
                && ingress.GetArrayLength() > 0)
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "networkPolicyIngress", "true");

            if (TryGetPropertyIgnoreCase(specElement, "egress", out JsonElement egress)
                && egress.ValueKind is JsonValueKind.Array
                && egress.GetArrayLength() > 0)
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "networkPolicyEgress", "true");

            return;
        }

        JsonElement podSpec = ResolvePodSpec(specElement, kind);

        if (podSpec.ValueKind is not JsonValueKind.Object)
            return;

        if (TryGetPropertyIgnoreCase(podSpec, "hostNetwork", out JsonElement hostNetwork)
            && hostNetwork.ValueKind is JsonValueKind.True)
            CanonicalInfrastructurePropertyBag.TryAddK8sProperty(properties, "hostNetwork", "true");

        ProjectContainerSecurityContext(podSpec, properties);
    }

    private static JsonElement ResolvePodSpec(JsonElement specElement, string kind)
    {
        if (string.Equals(kind, "Pod", StringComparison.OrdinalIgnoreCase))
            return specElement;

        if (string.Equals(kind, "CronJob", StringComparison.OrdinalIgnoreCase))
        {
            if (TryGetPropertyIgnoreCase(specElement, "jobTemplate", out JsonElement jobTemplate)
                && jobTemplate.ValueKind is JsonValueKind.Object
                && TryGetPropertyIgnoreCase(jobTemplate, "spec", out JsonElement cronJobSpec)
                && cronJobSpec.ValueKind is JsonValueKind.Object
                && TryGetPropertyIgnoreCase(cronJobSpec, "template", out JsonElement cronJobPodTemplate)
                && cronJobPodTemplate.ValueKind is JsonValueKind.Object
                && TryGetPropertyIgnoreCase(cronJobPodTemplate, "spec", out JsonElement cronJobPodSpec))
                return cronJobPodSpec;

            return default;
        }

        if (TryGetPropertyIgnoreCase(specElement, "template", out JsonElement workloadTemplate)
            && workloadTemplate.ValueKind is JsonValueKind.Object
            && TryGetPropertyIgnoreCase(workloadTemplate, "spec", out JsonElement workloadPodSpec))
            return workloadPodSpec;

        return default;
    }

    private static void ProjectContainerSecurityContext(JsonElement podSpec, Dictionary<string, string> properties)
    {
        bool privileged = false;
        bool allowPrivilegeEscalation = false;
        bool sawRunAsNonRoot = false;
        bool allRunAsNonRootTrue = true;
        bool anyRunAsNonRootFalse = false;

        void InspectContainer(JsonElement container)
        {
            if (!TryGetPropertyIgnoreCase(container, "securityContext", out JsonElement securityContext)
                || securityContext.ValueKind is not JsonValueKind.Object)
                return;

            if (TryGetPropertyIgnoreCase(securityContext, "privileged", out JsonElement privilegedElement)
                && privilegedElement.ValueKind is JsonValueKind.True)
                privileged = true;

            if (TryGetPropertyIgnoreCase(securityContext, "allowPrivilegeEscalation", out JsonElement escalationElement)
                && escalationElement.ValueKind is JsonValueKind.True)
                allowPrivilegeEscalation = true;

            if (TryGetPropertyIgnoreCase(securityContext, "runAsNonRoot", out JsonElement runAsNonRootElement))
            {
                sawRunAsNonRoot = true;

                if (runAsNonRootElement.ValueKind is JsonValueKind.True)
                    allRunAsNonRootTrue = allRunAsNonRootTrue && true;
                else if (runAsNonRootElement.ValueKind is JsonValueKind.False)
                    anyRunAsNonRootFalse = true;
            }
        }

        if (TryGetPropertyIgnoreCase(podSpec, "containers", out JsonElement containers)
            && containers.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement container in containers.EnumerateArray())
                InspectContainer(container);
        }

        if (TryGetPropertyIgnoreCase(podSpec, "initContainers", out JsonElement initContainers)
            && initContainers.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement container in initContainers.EnumerateArray())
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

    private static string BuildStableObjectId(
        string objectType,
        InfrastructureDeclarationReference declaration,
        string kind,
        string canonicalName)
    {
        return InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
            declaration.DeclarationId,
            objectType,
            $"{kind.ToLowerInvariant()}|{canonicalName}");
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

    private static string? ReadTopLevelString(JsonElement resource, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(resource, propertyName, out JsonElement value) || value.ValueKind is not JsonValueKind.String)
            return null;

        string? text = value.GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }

    private static string? ReadMetadataString(JsonElement resource, string objectName, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(resource, objectName, out JsonElement objectElement) || objectElement.ValueKind is not JsonValueKind.Object)
            return null;

        if (!TryGetPropertyIgnoreCase(objectElement, propertyName, out JsonElement value) || value.ValueKind is not JsonValueKind.String)
            return null;

        string? text = value.GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.TryGetProperty(propertyName, out value))
            return true;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
