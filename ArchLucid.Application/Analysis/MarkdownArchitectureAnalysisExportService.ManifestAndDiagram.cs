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

            if (!string.IsNullOrWhiteSpace(report.Manifest.Metadata.ParentManifestVersion))

                sb.AppendLine($"- Parent Manifest Version: {report.Manifest.Metadata.ParentManifestVersion}");

            sb.AppendLine($"- Service Count: {report.Manifest.Services.Count}");
            sb.AppendLine($"- Datastore Count: {report.Manifest.Datastores.Count}");
            sb.AppendLine($"- Relationship Count: {report.Manifest.Relationships.Count}");
            sb.AppendLine();

            if (report.Manifest.Services.Count > 0)
            {
                sb.AppendLine("### Services");
                sb.AppendLine();

                foreach (ManifestService service in report.Manifest.Services.OrderBy(x => x.ServiceName))
                {
                    sb.AppendLine($"- **{service.ServiceName}**");
                    sb.AppendLine($"  - Type: {ArchitectureManifestTopologyExport.FormatServiceTypeForExport(service.ServiceType)}");
                    sb.AppendLine($"  - Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(service.RuntimePlatform)}");

                    if (!string.IsNullOrWhiteSpace(service.Purpose))

                        sb.AppendLine($"  - Purpose: {service.Purpose}");

                    if (service.RequiredControls.Count > 0)

                        sb.AppendLine($"  - Required Controls: {string.Join(", ", service.RequiredControls)}");
                }

                sb.AppendLine();
            }

            if (report.Manifest.Datastores.Count > 0)
            {
                sb.AppendLine("### Datastores");
                sb.AppendLine();

                foreach (ManifestDatastore datastore in report.Manifest.Datastores.OrderBy(x => x.DatastoreName))
                {
                    sb.AppendLine($"- **{datastore.DatastoreName}**");
                    sb.AppendLine($"  - Type: {ArchitectureManifestTopologyExport.FormatDatastoreTypeForExport(datastore.DatastoreType)}");
                    sb.AppendLine($"  - Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(datastore.RuntimePlatform)}");
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
                sb.AppendLine($"- Required Controls: {string.Join(", ", report.Manifest.Governance.RequiredControls)}");
                sb.AppendLine($"- Compliance Tags: {string.Join(", ", report.Manifest.Governance.ComplianceTags)}");
                sb.AppendLine(
                    $"- Policy Constraints: {string.Join(", ", report.Manifest.Governance.PolicyConstraints)}");
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
            sb.AppendLine("```mermaid");
            sb.AppendLine(report.Diagram);
            sb.AppendLine("```");
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
