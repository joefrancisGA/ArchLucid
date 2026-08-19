global using ArchLucid.Contracts.Findings.Payloads;

global using AuthorityCommitProjectionInput = ArchLucid.Core.Persistence.Ports.AuthorityCommitProjectionInput;
global using ContractGoldenManifestPersistence = ArchLucid.Core.Manifest.Mapping.ContractGoldenManifestPersistence;
global using ExplainabilityTrace = ArchLucid.Contracts.Findings.ExplainabilityTrace;
global using Finding = ArchLucid.Contracts.Findings.Finding;
global using FindingEngineFailure = ArchLucid.Contracts.Findings.FindingEngineFailure;
global using FindingsSerialization = ArchLucid.Core.Findings.Serialization.FindingsSerialization;
global using FindingsSnapshot = ArchLucid.Contracts.Findings.FindingsSnapshot;
global using FindingsSnapshotMigrator = ArchLucid.Core.Findings.Serialization.FindingsSnapshotMigrator;
global using IAuthorityCommitProjectionBuilder = ArchLucid.Core.Persistence.Ports.IAuthorityCommitProjectionBuilder;
global using IFindingsSnapshotRepository = ArchLucid.Core.Persistence.Ports.IFindingsSnapshotRepository;
global using IDecisionTraceRepository = ArchLucid.Core.Persistence.Ports.IDecisionTraceRepository;
global using IUnifiedGoldenManifestReader = ArchLucid.Core.Persistence.Ports.IUnifiedGoldenManifestReader;
