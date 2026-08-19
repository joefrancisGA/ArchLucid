global using ArchLucid.Contracts.Findings.Payloads;

global using AuthorityCommitProjectionInput = ArchLucid.Core.Persistence.Ports.AuthorityCommitProjectionInput;
global using ExplainabilityTrace = ArchLucid.Contracts.Findings.ExplainabilityTrace;
global using Finding = ArchLucid.Contracts.Findings.Finding;
global using FindingEngineFailure = ArchLucid.Contracts.Findings.FindingEngineFailure;
global using FindingRecordMetadataPage = ArchLucid.Contracts.Findings.FindingRecordMetadataPage;
global using FindingRecordMetadataRow = ArchLucid.Contracts.Findings.FindingRecordMetadataRow;
global using FindingsSchema = ArchLucid.Contracts.Findings.FindingsSchema;
global using FindingsSnapshot = ArchLucid.Contracts.Findings.FindingsSnapshot;
global using IAuthorityCommitProjectionBuilder = ArchLucid.Core.Persistence.Ports.IAuthorityCommitProjectionBuilder;
global using IDecisionEngine = ArchLucid.Core.Persistence.Ports.IDecisionEngine;
global using IDecisionTraceRepository = ArchLucid.Core.Persistence.Ports.IDecisionTraceRepository;
global using IFindingsSnapshotRepository = ArchLucid.Core.Persistence.Ports.IFindingsSnapshotRepository;
global using IUnifiedGoldenManifestReader = ArchLucid.Core.Persistence.Ports.IUnifiedGoldenManifestReader;
global using IComparisonService = ArchLucid.Core.Comparison.IComparisonService;
