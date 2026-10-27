using ArchLucid.Application.Determinism;
using ArchLucid.Application.Manifests;
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
        builder.AddParagraph(
            $"Request ID: {ConsultingDocxExportHonestyCopy.ResolveRequestId(report.Run.RequestId)}");
        builder.AddParagraph($"Status: {report.Run.Status}");
        builder.AddParagraph($"Created UTC: {report.Run.CreatedUtc:O}");
        builder.AddParagraph(
            report.Run.CompletedUtc.HasValue
                ? $"Completed UTC: {report.Run.CompletedUtc.Value:O}"
                : $"Completed UTC: {ArchitectureEvidenceRequestExport.MissingCompletedTimeCopy}");
        builder.AddParagraph(
            $"Current Manifest Version: {(string.IsNullOrWhiteSpace(report.Run.CurrentManifestVersion) ? ArchitectureEvidenceRequestExport.CurrentManifestVersionNotStoredCopy : report.Run.CurrentManifestVersion.Trim())}");
        builder.AddSpacer();
        if (report.Warnings.Count > 0)
        {
            builder.AddHeading("Report Warnings", 2);
            foreach (string warning in report.Warnings)
                builder.AddBullet(warning);
            builder.AddSpacer();
        }
        builder.AddHeading("Evidence Package", 2);
        if (report.Evidence is null)
        {
            builder.AddParagraph(ArchitectureEvidenceRequestExport.MissingEvidencePackageCopy);
            builder.AddSpacer();
        }
        else
        {
            builder.AddParagraph(
                $"Evidence Package ID: {ArchitectureEvidenceRequestExport.FormatIdentityField(report.Evidence.EvidencePackageId, ArchitectureEvidenceRequestExport.MissingEvidencePackageIdCopy)}");
            builder.AddParagraph(
                $"System Name: {ArchitectureEvidenceRequestExport.FormatIdentityField(report.Evidence.SystemName, ArchitectureEvidenceRequestExport.MissingSystemNameCopy)}");
            builder.AddParagraph(
                $"Environment: {ArchitectureEvidenceRequestExport.FormatIdentityField(report.Evidence.Environment, ArchitectureEvidenceRequestExport.MissingEnvironmentCopy)}");
            builder.AddParagraph(
                $"Cloud Provider: {ArchitectureEvidenceRequestExport.FormatIdentityField(report.Evidence.CloudProvider, ArchitectureEvidenceRequestExport.MissingCloudProviderCopy)}");
            builder.AddSpacer();
            builder.AddHeading("Request Context", 3);
            builder.AddParagraph(ArchitectureEvidenceRequestExport.FormatDescription(report.Evidence.Request.Description));
            if (report.Evidence.Request.Constraints.Count > 0)
            {
                builder.AddHeading("Constraints", 3);
                foreach (string item in report.Evidence.Request.Constraints)
                    builder.AddBullet(item);
            }
            else
            {
                builder.AddParagraph(ArchitectureEvidenceRequestExport.ConstraintsNotRecordedCopy);
            }

            if (report.Evidence.Request.RequiredCapabilities.Count > 0)
            {
                builder.AddHeading("Required Capabilities", 3);

                foreach (string item in report.Evidence.Request.RequiredCapabilities)
                    builder.AddBullet(item);
            }
            else
            {
                builder.AddParagraph(ArchitectureEvidenceRequestExport.RequiredCapabilitiesNotRecordedCopy);
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
                string taskLabel = string.IsNullOrWhiteSpace(trace.TaskId)
                    ? ArchitectureEvidenceRequestExport.TraceTaskIdNotStoredCopy
                    : trace.TaskId.Trim();
                builder.AddHeading($"{trace.AgentType} — Task {taskLabel}", 3);
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
                builder.AddHeading("Parsed Result", 4);
                builder.AddCodeBlock(
                    ArchitectureEvidenceRequestExport.FormatTraceField(
                        trace.ParsedResultJson,
                        ArchitectureEvidenceRequestExport.TraceParsedResultNotStoredCopy,
                        ArchitectureEvidenceRequestExport.TraceParsedResultStoredEmptyCopy),
                    "json");

                builder.AddSpacer();
            }
        }

        if (report.Manifest is not null)
        {
            builder.AddHeading("Architecture Manifest", 2);
            builder.AddParagraph(
                $"System Name: {ArchitectureEvidenceRequestExport.FormatIdentityField(report.Manifest.SystemName, ArchitectureEvidenceRequestExport.MissingSystemNameCopy)}");
            builder.AddParagraph($"Run ID: {report.Manifest.RunId}");
            builder.AddParagraph($"Manifest Version: {report.Manifest.Metadata.ManifestVersion}");

            if (!string.IsNullOrWhiteSpace(report.Manifest.Metadata.ParentManifestVersion))
                builder.AddParagraph($"Parent Manifest Version: {report.Manifest.Metadata.ParentManifestVersion}");

            builder.AddParagraph($"Service Count: {report.Manifest.Services.Count}");
            builder.AddParagraph($"Datastore Count: {report.Manifest.Datastores.Count}");
            builder.AddParagraph($"Relationship Count: {report.Manifest.Relationships.Count}");
            builder.AddSpacer();
            if (report.Manifest.Services.Count > 0)
            {
                builder.AddHeading("Services", 3);
                foreach (ManifestService service in report.Manifest.Services.OrderBy(x => x.ServiceName))
                {
                    string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
                        ? ArchitectureEvidenceRequestExport.ServiceNameNotStoredCopy
                        : service.ServiceName.Trim();
                    builder.AddParagraph(serviceName, true);
                    builder.AddBullet(
                        $"Type: {ArchitectureManifestTopologyExport.FormatServiceTypeForExport(service.ServiceType)}");
                    builder.AddBullet(
                        $"Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(service.RuntimePlatform)}");
                    builder.AddBullet(
                        string.IsNullOrWhiteSpace(service.Purpose)
                            ? $"Purpose: {ArchitectureEvidenceRequestExport.ServicePurposeNotStoredCopy}"
                            : $"Purpose: {service.Purpose.Trim()}");
                    if (service.RequiredControls.Count > 0)
                    {
                        builder.AddBullet($"Required Controls: {string.Join(", ", service.RequiredControls)}");
                    }
                    else
                    {
                        builder.AddBullet(
                            $"Required Controls: {ArchitectureEvidenceRequestExport.RequiredControlsNotStoredCopy}");
                    }
                }

                builder.AddSpacer();
            }

            if (report.Manifest.Datastores.Count > 0)
            {
                builder.AddHeading("Datastores", 3);
                foreach (ManifestDatastore datastore in report.Manifest.Datastores.OrderBy(x => x.DatastoreName))
                {
                    string datastoreName = string.IsNullOrWhiteSpace(datastore.DatastoreName)
                        ? ArchitectureEvidenceRequestExport.DatastoreNameNotStoredCopy
                        : datastore.DatastoreName.Trim();
                    builder.AddParagraph(datastoreName, true);
                    builder.AddBullet(
                        $"Type: {ArchitectureManifestTopologyExport.FormatDatastoreTypeForExport(datastore.DatastoreType)}");
                    builder.AddBullet(
                        $"Platform: {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(datastore.RuntimePlatform)}");
                    builder.AddBullet(
                        $"Private Endpoint Required: {ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(datastore.PrivateEndpointRequired)}");
                    builder.AddBullet(
                        $"Encryption At Rest Required: {ArchitectureManifestDatastoreExport.FormatEncryptionAtRestRequiredForExport(datastore.EncryptionAtRestRequired)}");
                }

                builder.AddSpacer();
            }

            ManifestGovernance governance = report.Manifest.Governance;

            if (ArchitectureManifestGovernanceExport.ShouldRender(governance))
            {
                builder.AddHeading("Governance", 3);
                builder.AddBullet(
                    $"Required Controls: {ArchitectureManifestGovernanceExport.FormatRequiredControlsForExport(governance.RequiredControls)}");
                builder.AddBullet(
                    $"Compliance Tags: {ArchitectureManifestGovernanceExport.FormatComplianceTagsForExport(governance.ComplianceTags)}");
                builder.AddBullet(
                    $"Policy Constraints: {ArchitectureManifestGovernanceExport.FormatPolicyConstraintsForExport(governance.PolicyConstraints)}");
                builder.AddBullet(
                    $"Risk Classification: {ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(governance)}");
                builder.AddBullet(
                    $"Cost Classification: {ArchitectureManifestGovernanceExport.FormatCostClassificationForExport(governance)}");
                builder.AddSpacer();
            }
        }

        builder.AddHeading("Architecture Diagram", 2);

        if (!string.IsNullOrWhiteSpace(report.Diagram))
        {
            byte[]? diagramBytes = await _diagramImageRenderer.RenderMermaidPngAsync(report.Diagram, cancellationToken);
            if (diagramBytes is not null && diagramBytes.Length > 0)
                builder.AddImage(diagramBytes, "Architecture Diagram", 6_000_000L, 3_500_000L);
            else
            {
                builder.AddParagraph("Diagram image rendering was not available. Mermaid source is included below.");
                builder.AddCodeBlock(report.Diagram, MermaidLanguage);
            }
        }
        else
        {
            builder.AddParagraph(ArchitectureEvidenceRequestExport.DiagramNotStoredCopy);
        }

        builder.AddSpacer();

        builder.AddHeading("Architecture Summary", 2);

        if (!string.IsNullOrWhiteSpace(report.Summary))
            builder.AddMultilineParagraphs(report.Summary);
        else
            builder.AddParagraph(ArchitectureEvidenceRequestExport.ArchitectureSummaryNotStoredCopy);

        builder.AddSpacer();

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
            builder.AddBullet($"Left Confidence: {AgentResultConfidenceDisplay.Format(delta.LeftConfidence, "Left confidence was not stored.")}");
            builder.AddBullet($"Right Confidence: {AgentResultConfidenceDisplay.Format(delta.RightConfidence, "Right confidence was not stored.")}");
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
        builder.AddHeading("Assumptions", 3);

        if (evidence.Request.Assumptions.Count == 0)
        {
            builder.AddParagraph(ArchitectureEvidenceRequestExport.AssumptionsNotRecordedCopy);
            return;
        }

        foreach (string assumption in evidence.Request.Assumptions)
            builder.AddBullet(assumption);
    }

    private static void AddEvidencePolicies(OpenXmlDocxDocumentBuilder builder, AgentEvidencePackage evidence)
    {
        builder.AddHeading("Policy Evidence", 3);

        if (evidence.Policies.Count == 0)
        {
            builder.AddParagraph(ArchitectureEvidenceRequestExport.PolicyEvidenceNotRecordedCopy);
            return;
        }

        foreach (PolicyEvidence policy in evidence.Policies.OrderBy(static item => item.Title))
        {
            builder.AddParagraph(policy.Title, true);
            builder.AddBullet($"Policy ID: {policy.PolicyId}");
            builder.AddBullet(
                $"Summary: {ArchitectureEvidenceRequestExport.FormatSummary(policy.Summary, ArchitectureEvidenceRequestExport.PolicySummaryNotStoredCopy)}");

            if (policy.RequiredControls.Count > 0)
            {
                builder.AddBullet($"Required Controls: {string.Join(", ", policy.RequiredControls)}");
            }
            else
            {
                builder.AddBullet(
                    $"Required Controls: {ArchitectureEvidenceRequestExport.RequiredControlsNotRecordedCopy}");
            }
        }
    }

    private static void AddEvidenceServiceCatalog(OpenXmlDocxDocumentBuilder builder, AgentEvidencePackage evidence)
    {
        builder.AddHeading("Service Catalog Hints", 3);

        if (evidence.ServiceCatalog.Count == 0)
        {
            builder.AddParagraph(ArchitectureEvidenceRequestExport.NoServiceCatalogRowsStoredCopy);
            return;
        }

        foreach (ServiceCatalogEvidence service in evidence.ServiceCatalog.OrderBy(static item => item.ServiceName))
        {
            string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
                ? ArchitectureEvidenceRequestExport.ServiceNameNotStoredCopy
                : service.ServiceName.Trim();
            string category = string.IsNullOrWhiteSpace(service.Category)
                ? ArchitectureEvidenceRequestExport.ServiceCategoryNotStoredCopy
                : service.Category.Trim();
            builder.AddParagraph(serviceName, true);
            builder.AddBullet($"Category: {category}");
            builder.AddBullet(
                $"Summary: {ArchitectureEvidenceRequestExport.FormatSummary(service.Summary, ArchitectureEvidenceRequestExport.ServiceCatalogSummaryNotStoredCopy)}");

            if (service.RecommendedUseCases.Count > 0)
            {
                builder.AddBullet($"Recommended Use Cases: {string.Join(", ", service.RecommendedUseCases)}");
            }
            else
            {
                builder.AddBullet(
                    $"Recommended Use Cases: {ArchitectureEvidenceRequestExport.RecommendedUseCasesNotStoredCopy}");
            }
        }
    }

    private static void AddEvidencePatterns(OpenXmlDocxDocumentBuilder builder, AgentEvidencePackage evidence)
    {
        builder.AddHeading("Pattern Hints", 3);

        if (evidence.Patterns.Count == 0)
        {
            builder.AddParagraph(ArchitectureEvidenceRequestExport.NoPatternRowsStoredCopy);
            return;
        }

        foreach (PatternEvidence pattern in evidence.Patterns.OrderBy(static item => item.Name))
        {
            string patternName = string.IsNullOrWhiteSpace(pattern.Name)
                ? ArchitectureEvidenceRequestExport.PatternNameNotStoredCopy
                : pattern.Name.Trim();
            string patternId = string.IsNullOrWhiteSpace(pattern.PatternId)
                ? ArchitectureEvidenceRequestExport.PatternIdNotStoredCopy
                : pattern.PatternId.Trim();
            builder.AddParagraph(patternName, true);
            builder.AddBullet($"Pattern ID: {patternId}");
            builder.AddBullet(
                $"Summary: {ArchitectureEvidenceRequestExport.FormatSummary(pattern.Summary, ArchitectureEvidenceRequestExport.PatternSummaryNotStoredCopy)}");

            if (pattern.SuggestedServices.Count > 0)
            {
                builder.AddBullet($"Suggested Services: {string.Join(", ", pattern.SuggestedServices)}");
            }
            else
            {
                builder.AddBullet(
                    $"Suggested Services: {ArchitectureEvidenceRequestExport.SuggestedServicesNotStoredCopy}");
            }
        }
    }
}
