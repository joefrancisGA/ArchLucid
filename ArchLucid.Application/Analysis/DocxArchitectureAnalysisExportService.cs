using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Diagrams;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Generates a structured DOCX analysis report from an <see cref = "ArchitectureAnalysisReport"/>,
///     rendering the Mermaid diagram as an embedded PNG image where possible.
/// </summary>
public sealed class DocxArchitectureAnalysisExportService(IDiagramImageRenderer diagramImageRenderer) : IArchitectureAnalysisDocxExportService
{
    private readonly IDiagramImageRenderer _diagramImageRenderer = diagramImageRenderer ?? throw new ArgumentNullException(nameof(diagramImageRenderer));
    private const string MermaidLanguage = "mermaid";

    public async Task<byte[]> GenerateDocxAsync(ArchitectureAnalysisReport report, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(report);
        using OpenXmlDocxDocumentBuilder builder = new();
        builder.AddHeading("ArchLucid Analysis Report", 1);
        builder.AddParagraph($"Run ID: {report.Run.RunId}");
        builder.AddParagraph($"Request ID: {report.Run.RequestId}");
        builder.AddParagraph($"Status: {report.Run.Status}");
        builder.AddParagraph($"Created UTC: {report.Run.CreatedUtc:O}");
        if (report.Run.CompletedUtc.HasValue)
            builder.AddParagraph($"Completed UTC: {report.Run.CompletedUtc.Value:O}");
        if (!string.IsNullOrWhiteSpace(report.Run.CurrentManifestVersion))
            builder.AddParagraph($"Current Manifest Version: {report.Run.CurrentManifestVersion}");
        builder.AddSpacer();
        if (report.Warnings.Count > 0)
        {
            builder.AddHeading("Report Warnings", 2);
            foreach (string warning in report.Warnings)
                builder.AddBullet(warning);
            builder.AddSpacer();
        }
        if (report.Evidence is not null)
        {
            builder.AddHeading("Evidence Package", 2);
            builder.AddParagraph($"Evidence Package ID: {report.Evidence.EvidencePackageId}");
            builder.AddParagraph($"System Name: {report.Evidence.SystemName}");
            builder.AddParagraph($"Environment: {report.Evidence.Environment}");
            builder.AddParagraph($"Cloud Provider: {report.Evidence.CloudProvider}");
            builder.AddSpacer();
            builder.AddHeading("Request Context", 3);
            builder.AddParagraph(report.Evidence.Request.Description);
            if (report.Evidence.Request.Constraints.Count > 0)
            {
                builder.AddHeading("Constraints", 3);
                foreach (string item in report.Evidence.Request.Constraints)
                    builder.AddBullet(item);
            }

            if (report.Evidence.Request.RequiredCapabilities.Count > 0)
            {
                builder.AddHeading("Required Capabilities", 3);

                foreach (string item in report.Evidence.Request.RequiredCapabilities)
                    builder.AddBullet(item);
            }

            AddEvidenceAssumptions(builder, report.Evidence);
            AddEvidencePolicies(builder, report.Evidence);
            AddEvidenceServiceCatalog(builder, report.Evidence);
            AddEvidencePatterns(builder, report.Evidence);
            builder.AddSpacer();
        }

        builder.AddHeading("Agent Execution Traces", 2);
        if (report.ExecutionTraces.Count == 0)
            builder.AddParagraph("No execution traces were found for this run.");
        else
        {
            foreach (AgentExecutionTrace trace in report.ExecutionTraces
                         .OrderBy(x => x.AgentType)
                         .ThenBy(x => x.CreatedUtc))
            {
                builder.AddHeading($"{trace.AgentType} — Task {trace.TaskId}", 3);
                builder.AddBullet($"Trace ID: {trace.TraceId}");
                builder.AddBullet($"Parse Succeeded: {(trace.ParseSucceeded ? "Yes" : "No")}");
                builder.AddBullet($"Created UTC: {trace.CreatedUtc:O}");
                if (!string.IsNullOrWhiteSpace(trace.ErrorMessage))
                    builder.AddBullet($"Error: {trace.ErrorMessage}");
                builder.AddHeading("System Prompt", 4);
                builder.AddCodeBlock(trace.SystemPrompt, "text");
                builder.AddHeading("User Prompt", 4);
                builder.AddCodeBlock(trace.UserPrompt, "text");
                builder.AddHeading("Raw Response", 4);
                builder.AddCodeBlock(trace.RawResponse, "json");
                if (!string.IsNullOrWhiteSpace(trace.ParsedResultJson))
                {
                    builder.AddHeading("Parsed Result", 4);
                    builder.AddCodeBlock(trace.ParsedResultJson, "json");
                }

                builder.AddSpacer();
            }
        }

        if (report.Manifest is not null)
        {
            builder.AddHeading("Architecture Manifest", 2);
            builder.AddParagraph($"System Name: {report.Manifest.SystemName}");
            builder.AddParagraph($"Run ID: {report.Manifest.RunId}");
            builder.AddParagraph($"Manifest Version: {report.Manifest.Metadata.ManifestVersion}");
            builder.AddParagraph($"Service Count: {report.Manifest.Services.Count}");
            builder.AddParagraph($"Datastore Count: {report.Manifest.Datastores.Count}");
            builder.AddParagraph($"Relationship Count: {report.Manifest.Relationships.Count}");
            builder.AddSpacer();
            if (report.Manifest.Services.Count > 0)
            {
                builder.AddHeading("Services", 3);
                foreach (ManifestService service in report.Manifest.Services.OrderBy(x => x.ServiceName))
                {
                    builder.AddParagraph(service.ServiceName, true);
                    builder.AddBullet($"Type: {service.ServiceType}");
                    builder.AddBullet($"Platform: {service.RuntimePlatform}");
                    if (!string.IsNullOrWhiteSpace(service.Purpose))
                        builder.AddBullet($"Purpose: {service.Purpose}");
                    if (service.RequiredControls.Count > 0)
                        builder.AddBullet($"Required Controls: {string.Join(", ", service.RequiredControls)}");
                }

                builder.AddSpacer();
            }

            if (report.Manifest.Datastores.Count > 0)
            {
                builder.AddHeading("Datastores", 3);
                foreach (ManifestDatastore datastore in report.Manifest.Datastores.OrderBy(x => x.DatastoreName))
                {
                    builder.AddParagraph(datastore.DatastoreName, true);
                    builder.AddBullet($"Type: {datastore.DatastoreType}");
                    builder.AddBullet($"Platform: {datastore.RuntimePlatform}");
                    builder.AddBullet($"Private Endpoint Required: {(datastore.PrivateEndpointRequired ? "Yes" : "No")}");
                    builder.AddBullet($"Encryption At Rest Required: {(datastore.EncryptionAtRestRequired ? "Yes" : "No")}");
                }

                builder.AddSpacer();
            }
        }

        if (!string.IsNullOrWhiteSpace(report.Diagram))
        {
            builder.AddHeading("Architecture Diagram", 2);
            byte[]? diagramBytes = await diagramImageRenderer.RenderMermaidPngAsync(report.Diagram, cancellationToken);
            if (diagramBytes is not null && diagramBytes.Length > 0)
                builder.AddImage(diagramBytes, "Architecture Diagram", 6_000_000L, 3_500_000L);
            else
            {
                builder.AddParagraph("Diagram image rendering was not available. Mermaid source is included below.");
                builder.AddCodeBlock(report.Diagram, MermaidLanguage);
            }

            builder.AddSpacer();
        }

        if (!string.IsNullOrWhiteSpace(report.Summary))
        {
            builder.AddHeading("Architecture Summary", 2);
            builder.AddMultilineParagraphs(report.Summary);
            builder.AddSpacer();
        }

        if (report.Determinism is not null)
        {
            builder.AddHeading("Determinism Check", 2);
            builder.AddParagraph($"Source Run ID: {report.Determinism.SourceRunId}");
            builder.AddParagraph($"Iterations: {report.Determinism.Iterations}");
            builder.AddParagraph($"Execution Mode: {report.Determinism.ExecutionMode}");
            builder.AddParagraph($"Is Deterministic: {(report.Determinism.IsDeterministic ? "Yes" : "No")}");
            builder.AddParagraph($"Baseline Replay Run ID: {report.Determinism.BaselineReplayRunId}");
            builder.AddSpacer();
            foreach (DeterminismIterationResult iteration in report.Determinism.IterationResults.OrderBy(x => x.IterationNumber))
            {
                builder.AddParagraph($"Iteration {iteration.IterationNumber}", true);
                builder.AddBullet($"Replay Run ID: {iteration.ReplayRunId}");
                builder.AddBullet($"Matches Baseline Agent Results: {(iteration.MatchesBaselineAgentResults ? "Yes" : "No")}");
                builder.AddBullet($"Matches Baseline Manifest: {(iteration.MatchesBaselineManifest ? "Yes" : "No")}");
                foreach (string warning in iteration.AgentDriftWarnings)
                    builder.AddBullet($"Agent Drift Warning: {warning}");
                foreach (string warning in iteration.ManifestDriftWarnings)
                    builder.AddBullet($"Manifest Drift Warning: {warning}");
                builder.AddSpacer();
            }
        }

        if (report.ManifestDiff is not null)
        {
            builder.AddHeading("Manifest Diff", 2);
            builder.AddDiffSection("Added Services", report.ManifestDiff.AddedServices);
            builder.AddDiffSection("Removed Services", report.ManifestDiff.RemovedServices);
            builder.AddDiffSection("Added Datastores", report.ManifestDiff.AddedDatastores);
            builder.AddDiffSection("Removed Datastores", report.ManifestDiff.RemovedDatastores);
            builder.AddDiffSection("Added Required Controls", report.ManifestDiff.AddedRequiredControls);
            builder.AddDiffSection("Removed Required Controls", report.ManifestDiff.RemovedRequiredControls);
            builder.AddDiffSection(
                "Added Relationships",
                report.ManifestDiff.AddedRelationships.Select(static relationship => relationship.ToDisplayLine()).ToList());
            builder.AddDiffSection(
                "Removed Relationships",
                report.ManifestDiff.RemovedRelationships.Select(static relationship => relationship.ToDisplayLine()).ToList());
            builder.AddDiffSection("Warnings", report.ManifestDiff.Warnings);
            builder.AddSpacer();
        }

        if (report.AgentResultDiff is null)
            return builder.Build();
        builder.AddHeading("Agent Result Diff", 2);
        foreach (AgentResultDelta delta in report.AgentResultDiff.AgentDeltas.OrderBy(x => x.AgentType))
        {
            builder.AddParagraph(delta.AgentType.ToString(), true);
            builder.AddBullet($"Left Exists: {(delta.LeftExists ? "Yes" : "No")}");
            builder.AddBullet($"Right Exists: {(delta.RightExists ? "Yes" : "No")}");
            builder.AddBullet($"Left Confidence: {(delta.LeftConfidence.HasValue ? delta.LeftConfidence.Value.ToString("0.00") : "n/a")}");
            builder.AddBullet($"Right Confidence: {(delta.RightConfidence.HasValue ? delta.RightConfidence.Value.ToString("0.00") : "n/a")}");
            builder.AddDiffSection("Added Claims", delta.AddedClaims);
            builder.AddDiffSection("Removed Claims", delta.RemovedClaims);
            builder.AddDiffSection("Added Findings", delta.AddedFindings);
            builder.AddDiffSection("Removed Findings", delta.RemovedFindings);
            builder.AddDiffSection("Added Required Controls", delta.AddedRequiredControls);
            builder.AddDiffSection("Removed Required Controls", delta.RemovedRequiredControls);
            builder.AddDiffSection("Added Warnings", delta.AddedWarnings);
            builder.AddDiffSection("Removed Warnings", delta.RemovedWarnings);
            builder.AddDiffSection("Added Evidence References", delta.AddedEvidenceRefs);
            builder.AddDiffSection("Removed Evidence References", delta.RemovedEvidenceRefs);
            builder.AddSpacer();
        }

        return builder.Build();
    }

    private static void AddEvidenceAssumptions(OpenXmlDocxDocumentBuilder builder, AgentEvidencePackage evidence)
    {
        if (evidence.Request.Assumptions.Count == 0)
            return;

        builder.AddHeading("Assumptions", 3);

        foreach (string assumption in evidence.Request.Assumptions)
            builder.AddBullet(assumption);
    }

    private static void AddEvidencePolicies(OpenXmlDocxDocumentBuilder builder, AgentEvidencePackage evidence)
    {
        if (evidence.Policies.Count == 0)
            return;

        builder.AddHeading("Policy Evidence", 3);

        foreach (PolicyEvidence policy in evidence.Policies.OrderBy(static item => item.Title))
        {
            builder.AddParagraph(policy.Title, true);
            builder.AddBullet($"Policy ID: {policy.PolicyId}");
            builder.AddBullet($"Summary: {policy.Summary}");

            if (policy.RequiredControls.Count > 0)
                builder.AddBullet($"Required Controls: {string.Join(", ", policy.RequiredControls)}");
        }
    }

    private static void AddEvidenceServiceCatalog(OpenXmlDocxDocumentBuilder builder, AgentEvidencePackage evidence)
    {
        if (evidence.ServiceCatalog.Count == 0)
            return;

        builder.AddHeading("Service Catalog Hints", 3);

        foreach (ServiceCatalogEvidence service in evidence.ServiceCatalog.OrderBy(static item => item.ServiceName))
        {
            builder.AddParagraph(service.ServiceName, true);
            builder.AddBullet($"Category: {service.Category}");
            builder.AddBullet($"Summary: {service.Summary}");

            if (service.RecommendedUseCases.Count > 0)
                builder.AddBullet($"Recommended Use Cases: {string.Join(", ", service.RecommendedUseCases)}");
        }
    }

    private static void AddEvidencePatterns(OpenXmlDocxDocumentBuilder builder, AgentEvidencePackage evidence)
    {
        if (evidence.Patterns.Count == 0)
            return;

        builder.AddHeading("Pattern Hints", 3);

        foreach (PatternEvidence pattern in evidence.Patterns.OrderBy(static item => item.Name))
        {
            builder.AddParagraph(pattern.Name, true);
            builder.AddBullet($"Pattern ID: {pattern.PatternId}");
            builder.AddBullet($"Summary: {pattern.Summary}");

            if (pattern.SuggestedServices.Count > 0)
                builder.AddBullet($"Suggested Services: {string.Join(", ", pattern.SuggestedServices)}");
        }
    }
}
