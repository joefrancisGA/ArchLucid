using System.Text;

using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Analysis;

public sealed partial class MarkdownArchitectureAnalysisExportService
{
    private static void AppendManifestAndDiagram(StringBuilder sb, ArchitectureAnalysisReport report)
    {
        if (report.Manifest is not null)
        {
            sb.AppendLine("## Architecture Manifest");
            sb.AppendLine();
            sb.AppendLine($"- System Name: {report.Manifest.SystemName}");
            sb.AppendLine($"- Run ID: {report.Manifest.RunId}");
            sb.AppendLine($"- Manifest Version: {report.Manifest.Metadata.ManifestVersion}");

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
                    sb.AppendLine($"  - Type: {service.ServiceType}");
                    sb.AppendLine($"  - Platform: {service.RuntimePlatform}");

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
                    sb.AppendLine($"  - Type: {datastore.DatastoreType}");
                    sb.AppendLine($"  - Platform: {datastore.RuntimePlatform}");
                    sb.AppendLine(
                        $"  - Private Endpoint Required: {(datastore.PrivateEndpointRequired ? "Yes" : "No")}");
                    sb.AppendLine(
                        $"  - Encryption At Rest Required: {(datastore.EncryptionAtRestRequired ? "Yes" : "No")}");
                }

                sb.AppendLine();
            }

            if (report.Manifest.Governance.RequiredControls.Count > 0
                || report.Manifest.Governance.ComplianceTags.Count > 0
                || report.Manifest.Governance.PolicyConstraints.Count > 0)
            {
                sb.AppendLine("### Governance");
                sb.AppendLine();
                sb.AppendLine($"- Required Controls: {string.Join(", ", report.Manifest.Governance.RequiredControls)}");
                sb.AppendLine($"- Compliance Tags: {string.Join(", ", report.Manifest.Governance.ComplianceTags)}");
                sb.AppendLine(
                    $"- Policy Constraints: {string.Join(", ", report.Manifest.Governance.PolicyConstraints)}");
                sb.AppendLine($"- Risk Classification: {report.Manifest.Governance.RiskClassification}");
                sb.AppendLine($"- Cost Classification: {report.Manifest.Governance.CostClassification}");
                sb.AppendLine();
            }
        }

        if (!string.IsNullOrWhiteSpace(report.Diagram))
        {
            sb.AppendLine("## Diagram");
            sb.AppendLine();
            sb.AppendLine("```mermaid");
            sb.AppendLine(report.Diagram);
            sb.AppendLine("```");
            sb.AppendLine();
        }

        if (!string.IsNullOrWhiteSpace(report.Summary))
        {
            sb.AppendLine("## Architecture Summary");
            sb.AppendLine();
            sb.AppendLine(report.Summary.Trim());
            sb.AppendLine();
        }
    }
}
