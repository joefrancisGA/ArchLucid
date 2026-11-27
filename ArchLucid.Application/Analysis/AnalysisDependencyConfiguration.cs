using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Analysis;

/// <summary>Only outcome-affecting settings are fingerprinted. Raw settings never enter the checkpoint or logs.</summary>
public sealed class AnalysisDependencyConfiguration(
    IConfiguration configuration, ITenantFindingEngineControlsService? findingControls = null,
    IAgentResultRepository? agentResults = null)
{
    internal async Task<string> ForAuthorityAsync(string stage, AuthorityPipelineContext context, CancellationToken ct)
    {
        string[] sections = stage switch
        {
            AuthorityPipelineStageNames.ContextIngestion => ["ContextIngestion", "ArchLucid:ContextIngestion", "ArchLucid:EvidenceInjectionMitigation"],
            AuthorityPipelineStageNames.Graph => ["KnowledgeGraph", "ArchLucid:KnowledgeGraph"],
            AuthorityPipelineStageNames.Findings =>
            [
                "Findings", "InsightDensityGate", "FindingSemanticSupportBand", "FindingVerification",
                "SponsorRoi:CostEvidenceFreshness", "ArchLucid:Findings", "ArchLucid:Agents:PromptVariants",
                "ArchLucid:TechnologyConsistency:FindingEngine", "FindingEvidenceLinkage"
            ],
            _ => ["ArchLucid:AuthorityPipeline:HaltOnPartialFindings", "Decisioning", "ArchLucid:Decisioning", "ArtifactSynthesis", "ArchLucid:ArtifactSynthesis"]
        };
        object? tenant = null;

        if (stage == AuthorityPipelineStageNames.Findings && findingControls is not null)
            tenant = await findingControls.GetAsync(ct);

        string[] results = [];

        if (stage == AuthorityPipelineStageNames.Findings && agentResults is not null)
        {
            var rows = await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                agentResults, context.Scope,
                AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(context.Run.RunId.ToString("D")),
                useRollupProjection: false, ct);
            results = rows.Select(result => AnalysisDependencyFingerprint.Digest(result)).Order(StringComparer.Ordinal).ToArray();
        }

        return AnalysisDependencyFingerprint.Digest(new { Settings = Snapshot(sections), Tenant = tenant, AgentResults = results });
    }

    internal string ForSecureNow() => AnalysisDependencyFingerprint.Digest(Snapshot(
        ["ArchLucid:SecureNowArchitect", "SecureNowArchitect", "InfraEvidence:SecureNowArchitect"]));

    private KeyValuePair<string, string?>[] Snapshot(string[] paths) =>
        paths.SelectMany(path => configuration.GetSection(path).AsEnumerable())
            .OrderBy(item => item.Key, StringComparer.Ordinal)
            .ToArray();
}
