using System.Text;

using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Analysis;

public sealed partial class MarkdownArchitectureAnalysisExportService
{
    private static void AppendManifestAndDiagram(StringBuilder sb, ArchitectureAnalysisReport report)
    {
        if (report.Manifest is null)
        {
            sb.AppendLine("## Architecture Manifest");
            sb.AppendLine();
            sb.AppendLine($"- {ConsultingDocxExportHonestyCopy.CommittedManifestNotStored}");
            sb.AppendLine();
        }
        else
        {
            sb.AppendLine("## Architecture Manifest");
            sb.AppendLine();
            string systemName = ConsultingDocxExportHonestyCopy.ResolveSystemName(
                report.Evidence?.SystemName,
                report.Manifest.SystemName);
            sb.AppendLine($"- System Name: {systemName}");
            sb.AppendLine($"- Run ID: {report.Manifest.RunId}");
            sb.AppendLine(
                $"- Manifest Version: {ConsultingDocxExportHonestyCopy.ResolveManifestVersionLabel(report.Manifest.Metadata.ManifestVersion)}");

            string? parentManifestVersion = report.Manifest.Metadata.ParentManifestVersion;

            if (parentManifestVersion is null)
            {
                sb.AppendLine(
                    $"- Parent Manifest Version: {ArchitectureEvidenceRequestExport.ParentManifestVersionNotStoredCopy}");
            }
            else if (string.IsNullOrWhiteSpace(parentManifestVersion))
            {
                sb.AppendLine(
                    $"- Parent Manifest Version: {ArchitectureEvidenceRequestExport.ParentManifestVersionStoredEmptyCopy}");
            }
            else
            {
                sb.AppendLine($"- Parent Manifest Version: {parentManifestVersion.Trim()}");
            }

            sb.AppendLine(
                $"- {ArchitectureManifestMarkdownSummaryExport.FormatManifestCollectionCountLabel("Service", report.Manifest.Services.Count)}");
            sb.AppendLine(
                $"- {ArchitectureManifestMarkdownSummaryExport.FormatManifestCollectionCountLabel("Datastore", report.Manifest.Datastores.Count)}");
            sb.AppendLine(
                $"- {ArchitectureManifestMarkdownSummaryExport.FormatManifestCollectionCountLabel("Relationship", report.Manifest.Relationships.Count)}");
            sb.AppendLine();

            if (report.Manifest.Services.Count > 0)
            {
                sb.AppendLine("### Services");
                sb.AppendLine();

                foreach (ManifestService service in report.Manifest.Services.OrderBy(x => x.ServiceName))
                {
                    string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
                        ? ArchitectureEvidenceRequestExport.ServiceNameNotStoredCopy
                        : service.ServiceName.Trim();
                    sb.AppendLine($"- **{serviceName}**");
                    sb.AppendLine($"  - Type: {ArchitectureManifestTopologyExport.FormatServiceTypeForExport(service.ServiceType)}");
                    sb.AppendLine($"  - Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(service.RuntimePlatform)}");

                    sb.AppendLine(
                        string.IsNullOrWhiteSpace(service.Purpose)
                            ? $"  - Purpose: {ArchitectureEvidenceRequestExport.ServicePurposeNotStoredCopy}"
                            : $"  - Purpose: {service.Purpose}");

                    sb.AppendLine(
                        service.RequiredControls.Count > 0
                            ? $"  - Required Controls: {string.Join(", ", service.RequiredControls)}"
                            : $"  - Required Controls: {ArchitectureEvidenceRequestExport.RequiredControlsNotStoredCopy}");
                }

                sb.AppendLine();
            }

            if (report.Manifest.Datastores.Count > 0)
            {
                sb.AppendLine("### Datastores");
                sb.AppendLine();

                foreach (ManifestDatastore datastore in report.Manifest.Datastores.OrderBy(x => x.DatastoreName))
                {
                    string datastoreName = string.IsNullOrWhiteSpace(datastore.DatastoreName)
                        ? ArchitectureEvidenceRequestExport.DatastoreNameNotStoredCopy
                        : datastore.DatastoreName.Trim();
                    sb.AppendLine($"- **{datastoreName}**");
                    sb.AppendLine($"  - Type: {ArchitectureManifestTopologyExport.FormatDatastoreTypeForExport(datastore.DatastoreType)}");
                    sb.AppendLine($"  - Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(datastore.RuntimePlatform)}");
                    sb.AppendLine(
                        string.IsNullOrWhiteSpace(datastore.Purpose)
                            ? $"  - Purpose: {ArchitectureEvidenceRequestExport.ServicePurposeNotStoredCopy}"
                            : $"  - Purpose: {datastore.Purpose.Trim()}");
                    sb.AppendLine(
                        $"  - Private Endpoint Required: {ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(datastore.PrivateEndpointRequired)}");
                    sb.AppendLine(
                        $"  - Encryption At Rest Required: {ArchitectureManifestDatastoreExport.FormatEncryptionAtRestRequiredForExport(datastore.EncryptionAtRestRequired)}");
                }

                sb.AppendLine();
            }

            if (ArchitectureManifestGovernanceExport.ShouldRender(report.Manifest.Governance))
            {
                sb.AppendLine("### Governance");
                sb.AppendLine();
                sb.AppendLine(
                    $"- Required Controls: {ArchitectureManifestGovernanceExport.FormatRequiredControlsForExport(report.Manifest.Governance.RequiredControls)}");
                sb.AppendLine(
                    $"- Compliance Tags: {ArchitectureManifestGovernanceExport.FormatComplianceTagsForExport(report.Manifest.Governance.ComplianceTags)}");
                sb.AppendLine(
                    $"- Policy Constraints: {ArchitectureManifestGovernanceExport.FormatPolicyConstraintsForExport(report.Manifest.Governance.PolicyConstraints)}");
                sb.AppendLine(
                    $"- Risk Classification: {ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(report.Manifest.Governance)}");
                sb.AppendLine(
                    $"- Cost Classification: {ArchitectureManifestGovernanceExport.FormatCostClassificationForExport(report.Manifest.Governance)}");
                sb.AppendLine();
            }
        }

        sb.AppendLine("## Diagram");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(report.Diagram))
        {
            AppendFencedMarkdownBlock(sb, "mermaid", report.Diagram);
        }
        else
        {
            sb.AppendLine(ConsultingDocxAppendixHonestyCopy.MermaidSourceNotStored);
            sb.AppendLine();
        }

        sb.AppendLine();

        sb.AppendLine("## Architecture Summary");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(report.Summary))
            sb.AppendLine(report.Summary.Trim());
        else
            sb.AppendLine(ArchitectureEvidenceRequestExport.ArchitectureSummaryNotStoredCopy);

        sb.AppendLine();
    }
}
