using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;

namespace ArchLucid.Application.Runs.Coordination;

/// <summary>
///     Cloud-aware policy-pack and service-catalog reference tokens for starter evidence bundles (TB-2244).
/// </summary>
internal static class RunStarterCloudEvidenceRefs
{
    internal const string PolicyPackEnterpriseDefault = "policy-pack:enterprise-default";
    internal const string PolicyPackAzureSecurityBaseline = "policy-pack:azure-security-baseline";
    internal const string PolicyPackAwsSecurityBaseline = "policy-pack:aws-security-baseline";
    internal const string PolicyPackGcpSecurityBaseline = "policy-pack:gcp-security-baseline";
    internal const string PolicyPrivateNetworkingRequired = "policy:private-networking-required";
    internal const string PolicyManagedIdentityRequired = "policy:managed-identity-required";
    internal const string PolicyEncryptionAtRestRequired = "policy:encryption-at-rest-required";
    internal const string CatalogAzureCoreServices = "catalog:azure-core-services";
    internal const string CatalogAzureSql = "catalog:azure-sql";
    internal const string CatalogAzureAiSearch = "catalog:azure-ai-search";
    internal const string CatalogAzureAiServices = "catalog:azure-ai-services";
    internal const string CatalogAwsCoreServices = "catalog:aws-core-services";
    internal const string CatalogAwsRds = "catalog:aws-rds";
    internal const string CatalogAwsOpenSearch = "catalog:aws-opensearch";
    internal const string CatalogAwsBedrock = "catalog:aws-bedrock";
    internal const string CatalogGcpCoreServices = "catalog:gcp-core-services";
    internal const string CatalogGcpCloudSql = "catalog:gcp-cloud-sql";
    internal const string CatalogGcpVertexSearch = "catalog:gcp-vertex-search";
    internal const string CatalogGcpVertexAi = "catalog:gcp-vertex-ai";

    internal static List<string> BuildPolicyRefs(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        List<string> refs = [PolicyPackEnterpriseDefault];

        string? cloudBaseline = ResolveCloudSecurityBaselineRef(request.CloudProvider);

        if (!string.IsNullOrWhiteSpace(cloudBaseline))
            refs.Add(cloudBaseline);

        if (RequestConstraintClassifier.HasPrivateNetworkingConstraint(request))
            refs.Add(PolicyPrivateNetworkingRequired);

        if (RequestConstraintClassifier.HasManagedIdentityConstraint(request))
            refs.Add(PolicyManagedIdentityRequired);

        if (RequestConstraintClassifier.HasEncryptionConstraint(request))
            refs.Add(PolicyEncryptionAtRestRequired);

        return refs.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    internal static List<string> BuildServiceCatalogRefs(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        List<string> refs = [];

        switch (request.CloudProvider)
        {
            case CloudProvider.Azure:
                refs.Add(CatalogAzureCoreServices);
                refs.Add(CatalogAzureSql);

                if (RequestConstraintClassifier.RequiresSearchCapability(request))
                    refs.Add(CatalogAzureAiSearch);

                if (RequestConstraintClassifier.RequiresAiCapability(request))
                    refs.Add(CatalogAzureAiServices);

                break;
            case CloudProvider.Aws:
                refs.Add(CatalogAwsCoreServices);
                refs.Add(CatalogAwsRds);

                if (RequestConstraintClassifier.RequiresSearchCapability(request))
                    refs.Add(CatalogAwsOpenSearch);

                if (RequestConstraintClassifier.RequiresAiCapability(request))
                    refs.Add(CatalogAwsBedrock);

                break;
            case CloudProvider.Gcp:
                refs.Add(CatalogGcpCoreServices);
                refs.Add(CatalogGcpCloudSql);

                if (RequestConstraintClassifier.RequiresSearchCapability(request))
                    refs.Add(CatalogGcpVertexSearch);

                if (RequestConstraintClassifier.RequiresAiCapability(request))
                    refs.Add(CatalogGcpVertexAi);

                break;
            case CloudProvider.None:
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(request), request.CloudProvider, "Unsupported cloud provider.");
        }

        return refs.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static string? ResolveCloudSecurityBaselineRef(CloudProvider cloudProvider) =>
        cloudProvider switch
        {
            CloudProvider.Azure => PolicyPackAzureSecurityBaseline,
            CloudProvider.Aws => PolicyPackAwsSecurityBaseline,
            CloudProvider.Gcp => PolicyPackGcpSecurityBaseline,
            CloudProvider.None => null,
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, "Unsupported cloud provider."),
        };
}
