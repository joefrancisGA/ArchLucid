/*
  Rollback 129: remove RLS bindings added for denormalized scope columns, then drop those columns.
  Forward: 129_RlsAuthorityChildTableScopeDenorm.sql
  See docs/security/MULTI_TENANT_RLS.md — break-glass only; re-apply 129 after corrective work if needed.
*/

SET XACT_ABORT ON;
GO

/* --- Part 1: drop security predicates (reverse order of forward migration) --- */









































/* --- Part 2: drop denormalized scope columns (ProjectId vs ScopeProjectId) --- */

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingRecords', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingRecords DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingRecords', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingRecords DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingRecords', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingRecords DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.FindingRelatedNodes', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingRelatedNodes', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingRelatedNodes DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingRelatedNodes', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingRelatedNodes DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingRelatedNodes', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingRelatedNodes DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.FindingRecommendedActions', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingRecommendedActions', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingRecommendedActions DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingRecommendedActions', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingRecommendedActions DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingRecommendedActions', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingRecommendedActions DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.FindingProperties', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingProperties', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingProperties DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingProperties', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingProperties DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingProperties', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingProperties DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.FindingTraceGraphNodesExamined', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingTraceGraphNodesExamined', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingTraceGraphNodesExamined DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingTraceGraphNodesExamined', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingTraceGraphNodesExamined DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingTraceGraphNodesExamined', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingTraceGraphNodesExamined DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.FindingTraceRulesApplied', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingTraceRulesApplied', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingTraceRulesApplied DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingTraceRulesApplied', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingTraceRulesApplied DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingTraceRulesApplied', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingTraceRulesApplied DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.FindingTraceDecisionsTaken', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingTraceDecisionsTaken', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingTraceDecisionsTaken DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingTraceDecisionsTaken', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingTraceDecisionsTaken DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingTraceDecisionsTaken', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingTraceDecisionsTaken DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.FindingTraceAlternativePaths', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingTraceAlternativePaths', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingTraceAlternativePaths DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingTraceAlternativePaths', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingTraceAlternativePaths DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingTraceAlternativePaths', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingTraceAlternativePaths DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.FindingTraceNotes', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingTraceNotes', N'TenantId') IS NOT NULL ALTER TABLE dbo.FindingTraceNotes DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.FindingTraceNotes', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.FindingTraceNotes DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.FindingTraceNotes', N'ProjectId') IS NOT NULL ALTER TABLE dbo.FindingTraceNotes DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GraphSnapshots', N'TenantId') IS NOT NULL ALTER TABLE dbo.GraphSnapshots DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GraphSnapshots', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GraphSnapshots DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GraphSnapshots', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.GraphSnapshots DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdges', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GraphSnapshotEdges', N'TenantId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotEdges DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GraphSnapshotEdges', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotEdges DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GraphSnapshotEdges', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotEdges DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodes', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GraphSnapshotNodes', N'TenantId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotNodes DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GraphSnapshotNodes', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotNodes DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GraphSnapshotNodes', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotNodes DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodeProperties', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GraphSnapshotNodeProperties', N'TenantId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotNodeProperties DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GraphSnapshotNodeProperties', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotNodeProperties DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GraphSnapshotNodeProperties', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotNodeProperties DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdgeProperties', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GraphSnapshotEdgeProperties', N'TenantId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotEdgeProperties DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GraphSnapshotEdgeProperties', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotEdgeProperties DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GraphSnapshotEdgeProperties', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotEdgeProperties DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotWarnings', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GraphSnapshotWarnings', N'TenantId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotWarnings DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GraphSnapshotWarnings', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotWarnings DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GraphSnapshotWarnings', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.GraphSnapshotWarnings DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjects', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ContextSnapshotCanonicalObjects', N'TenantId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotCanonicalObjects DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ContextSnapshotCanonicalObjects', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotCanonicalObjects DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ContextSnapshotCanonicalObjects', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotCanonicalObjects DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjectProperties', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ContextSnapshotCanonicalObjectProperties', N'TenantId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ContextSnapshotCanonicalObjectProperties', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ContextSnapshotCanonicalObjectProperties', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotWarnings', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ContextSnapshotWarnings', N'TenantId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotWarnings DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ContextSnapshotWarnings', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotWarnings DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ContextSnapshotWarnings', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotWarnings DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotErrors', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ContextSnapshotErrors', N'TenantId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotErrors DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ContextSnapshotErrors', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotErrors DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ContextSnapshotErrors', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotErrors DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotSourceHashes', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ContextSnapshotSourceHashes', N'TenantId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotSourceHashes DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ContextSnapshotSourceHashes', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotSourceHashes DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ContextSnapshotSourceHashes', N'ScopeProjectId') IS NOT NULL ALTER TABLE dbo.ContextSnapshotSourceHashes DROP COLUMN ScopeProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifacts', N'TenantId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifacts DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifacts', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifacts DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifacts', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifacts DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundleArtifactMetadata', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifactMetadata', N'TenantId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifactMetadata DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifactMetadata', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifactMetadata DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifactMetadata', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifactMetadata DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundleArtifactDecisionLinks', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifactDecisionLinks', N'TenantId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifactDecisionLinks DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifactDecisionLinks', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifactDecisionLinks DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ArtifactBundleArtifactDecisionLinks', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleArtifactDecisionLinks DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundleTraceGenerators', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceGenerators', N'TenantId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceGenerators DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceGenerators', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceGenerators DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceGenerators', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceGenerators DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundleTraceDecisionLinks', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceDecisionLinks', N'TenantId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceDecisionLinks DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceDecisionLinks', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceDecisionLinks DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceDecisionLinks', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceDecisionLinks DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ArtifactBundleTraceNotes', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceNotes', N'TenantId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceNotes DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceNotes', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceNotes DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ArtifactBundleTraceNotes', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ArtifactBundleTraceNotes DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ConversationMessages', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ConversationMessages', N'TenantId') IS NOT NULL ALTER TABLE dbo.ConversationMessages DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ConversationMessages', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ConversationMessages DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ConversationMessages', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ConversationMessages DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.PolicyPackVersions', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.PolicyPackVersions', N'TenantId') IS NOT NULL ALTER TABLE dbo.PolicyPackVersions DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.PolicyPackVersions', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.PolicyPackVersions DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.PolicyPackVersions', N'ProjectId') IS NOT NULL ALTER TABLE dbo.PolicyPackVersions DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.CompositeAlertRuleConditions', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.CompositeAlertRuleConditions', N'TenantId') IS NOT NULL ALTER TABLE dbo.CompositeAlertRuleConditions DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.CompositeAlertRuleConditions', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.CompositeAlertRuleConditions DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.CompositeAlertRuleConditions', N'ProjectId') IS NOT NULL ALTER TABLE dbo.CompositeAlertRuleConditions DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.EvolutionSimulationRuns', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.EvolutionSimulationRuns', N'TenantId') IS NOT NULL ALTER TABLE dbo.EvolutionSimulationRuns DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.EvolutionSimulationRuns', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.EvolutionSimulationRuns DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.EvolutionSimulationRuns', N'ProjectId') IS NOT NULL ALTER TABLE dbo.EvolutionSimulationRuns DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestWarnings', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestWarnings', N'TenantId') IS NOT NULL ALTER TABLE dbo.GoldenManifestWarnings DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GoldenManifestWarnings', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GoldenManifestWarnings DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GoldenManifestWarnings', N'ProjectId') IS NOT NULL ALTER TABLE dbo.GoldenManifestWarnings DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestDecisions', N'TenantId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisions DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GoldenManifestDecisions', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisions DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GoldenManifestDecisions', N'ProjectId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisions DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionEvidenceLinks', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestDecisionEvidenceLinks', N'TenantId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GoldenManifestDecisionEvidenceLinks', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GoldenManifestDecisionEvidenceLinks', N'ProjectId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionNodeLinks', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestDecisionNodeLinks', N'TenantId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisionNodeLinks DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GoldenManifestDecisionNodeLinks', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisionNodeLinks DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GoldenManifestDecisionNodeLinks', N'ProjectId') IS NOT NULL ALTER TABLE dbo.GoldenManifestDecisionNodeLinks DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceFindings', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceSourceFindings', N'TenantId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceSourceFindings', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceSourceFindings', N'ProjectId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'TenantId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'ProjectId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceAppliedRules', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceAppliedRules', N'TenantId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceAppliedRules', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.GoldenManifestProvenanceAppliedRules', N'ProjectId') IS NOT NULL ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanArchitectureRuns', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanArchitectureRuns', N'TenantId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanArchitectureRuns DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanArchitectureRuns', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanArchitectureRuns DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanArchitectureRuns', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanArchitectureRuns DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanSignalLinks', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanSignalLinks', N'TenantId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanSignalLinks DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanSignalLinks', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanSignalLinks DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanSignalLinks', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanSignalLinks DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanArtifactLinks', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanArtifactLinks', N'TenantId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanArtifactLinks DROP COLUMN TenantId;
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanArtifactLinks', N'WorkspaceId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanArtifactLinks DROP COLUMN WorkspaceId;
    IF COL_LENGTH(N'dbo.ProductLearningImprovementPlanArtifactLinks', N'ProjectId') IS NOT NULL ALTER TABLE dbo.ProductLearningImprovementPlanArtifactLinks DROP COLUMN ProjectId;
END;
GO
