using ArchLucid.Application;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecurityEvidencePathExplanationService(
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidenceCutPointRepository cutPointRepository,
    ISecurityEvidencePathExplanationRepository explanationRepository,
    IAgentCompletionClient llm,
    IPromptRedactor promptRedactor,
    ILogger<SecurityEvidencePathExplanationService> logger,
    ISecurityEvidencePathRankRepository? rankRepository = null) : ISecurityEvidencePathExplanationService
{
    public const int PathExplanationMaxOutputTokens = 800;

    private const string ExplanationSystemPrompt =
        "You are an enterprise cloud security architect summarizing a cited SecureNow architect path. "
        + "Return ONLY JSON with keys executiveSummary, businessImpactHypotheses, proposedRemediation, citedEvidenceRefs. "
        + "Use ONLY allowedEvidenceRefs for citedEvidenceRefs. "
        + "Do not invent Azure ARM resource ids, hops, snapshot rows, ExactMatch patterns, or ObservedFact claims. "
        + "Business impact lines must be explicit hypotheses (AiInference), not observed traffic or exfiltration.";

    public async Task<SecurityEvidencePathExplanationResult> TryBuildExplanationAsync(
        ScopeContext scope,
        Guid pathId,
        bool useSimulator,
        bool allowInsufficientEvidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            SecurityEvidencePathRecord? path =
                await pathRepository.TryGetByIdInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

            if (path is null)
            {
                return new SecurityEvidencePathExplanationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Security evidence path was not found in the current scope.",
                };
            }

            if (path.PathConfidenceBand == PathConfidenceBand.InsufficientEvidence && !allowInsufficientEvidence)
            {
                return new SecurityEvidencePathExplanationResult
                {
                    Succeeded = false,
                    ErrorMessage =
                        "Path explanation generation is skipped for InsufficientEvidence paths unless allowInsufficientEvidence is true.",
                };
            }

            IReadOnlyList<SecurityEvidencePathHopRecord> hops =
                await pathRepository.ListHopsByPathInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

            if (hops.Count == 0)
            {
                return new SecurityEvidencePathExplanationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Path explanation generation requires at least one hop.",
                };
            }

            IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints =
                await cutPointRepository.ListByPathIdInScopeAsync(scope.ToProjectScopeKey(), pathId, cancellationToken);

            IReadOnlyList<string> allowedEvidenceRefs =
                SecurityEvidencePathExplanationValidator.SelectAllowedEvidenceRefs(pathId, hops, cutPoints);
            string rankContext = await BuildRankContextAsync(scope, path, rankRepository, cancellationToken);

            HashSet<string> allowedArmIds = SecurityEvidencePathExplanationValidator.CollectAllowedArmIds(hops);
            SecurityEvidencePathExplanationTemplateResponse explanationTemplate =
                SecurityEvidencePathExplanationTemplateBuilder.Build(path, hops, cutPoints);

            SecurityEvidencePathExplanationContent content;
            ProvenanceKind provenanceKind;
            string? simulatorLabel = null;
            string? modelOutputRejection = null;

            if (useSimulator)
            {
                content = SecurityEvidencePathExplanationBuilder.BuildSimulatorExplanation(
                    path,
                    hops,
                    cutPoints,
                    allowedEvidenceRefs,
                    rankContext);

                provenanceKind = ProvenanceKind.DeterministicInference;
                simulatorLabel = SecurityEvidencePathExplanationBuilder.SimulatorLabel;
            }
            else
            {
                string userPrompt = SecurityEvidencePathExplanationBuilder.BuildLlmUserPrompt(
                    path,
                    hops,
                    cutPoints,
                    explanationTemplate,
                    allowedEvidenceRefs,
                    rankContext);

                PromptRedactionOutcome redactedPrompt = promptRedactor.Redact(userPrompt);

                try
                {
                    string llmJson = await llm.CompleteJsonAsync(
                        ExplanationSystemPrompt,
                        redactedPrompt.Text,
                        maxTokens: PathExplanationMaxOutputTokens,
                        cancellationToken: cancellationToken);

                    if (!SecurityEvidencePathExplanationBuilder.TryParseLlmResponse(
                            llmJson,
                            allowedEvidenceRefs,
                            allowedArmIds,
                            out content,
                            out string? rejectionReason))
                    {
                        content = SecurityEvidencePathExplanationBuilder.BuildSimulatorExplanation(
                            path,
                            hops,
                            cutPoints,
                            allowedEvidenceRefs,
                            rankContext);
                        provenanceKind = ProvenanceKind.DeterministicInference;
                        simulatorLabel = SecurityEvidencePathExplanationBuilder.SimulatorLabel;
                        modelOutputRejection =
                            rejectionReason ?? "Model output was rejected; showing the stored-path summary.";
                    }
                    else
                    {
                        provenanceKind = ProvenanceKind.AiInference;
                    }
                }
                catch (OperationCanceledException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(
                        ex,
                        "Model path explanation failed; using stored-path summary for PathId={PathId}.",
                        pathId);
                    content = SecurityEvidencePathExplanationBuilder.BuildSimulatorExplanation(
                        path,
                        hops,
                        cutPoints,
                        allowedEvidenceRefs,
                        rankContext);
                    provenanceKind = ProvenanceKind.DeterministicInference;
                    simulatorLabel = SecurityEvidencePathExplanationBuilder.SimulatorLabel;
                    modelOutputRejection =
                        "Model completion failed; showing the stored-path summary.";
                }
            }

            if (string.IsNullOrWhiteSpace(content.ExecutiveSummary))
            {
                return new SecurityEvidencePathExplanationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Path explanation generation returned empty text.",
                };
            }

            IReadOnlyList<string> validCitations = SecurityEvidencePathExplanationValidator.FilterCitedEvidenceRefs(
                content.CitedEvidenceRefs,
                allowedEvidenceRefs);

            DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
            Guid explanationId = Guid.NewGuid();

            SecurityEvidencePathExplanationRecord record = new()
            {
                ExplanationId = explanationId,
                PathId = pathId,
                TenantId = scope.TenantId,
                ExecutiveSummary = content.ExecutiveSummary,
                BusinessImpactHypotheses = content.BusinessImpactHypotheses,
                ProposedRemediation = content.ProposedRemediation,
                CitedEvidenceRefs = validCitations,
                ProvenanceKind = provenanceKind,
                SimulatorLabel = simulatorLabel,
                ModelOutputRejection = modelOutputRejection,
                CreatedUtc = createdUtc,
            };

            await explanationRepository.InsertAsync(record, cancellationToken);

            return new SecurityEvidencePathExplanationResult
            {
                Succeeded = true,
                Explanation = record,
            };
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (ConflictException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Path explanation generation failed for PathId={PathId}.", pathId);

            return new SecurityEvidencePathExplanationResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    private static async Task<string> BuildRankContextAsync(
        ScopeContext scope,
        SecurityEvidencePathRecord selectedPath,
        ISecurityEvidencePathRankRepository? rankRepository,
        CancellationToken cancellationToken)
    {
        if (rankRepository is null)
        {
            return "No next stored path is available. This does not change the rank.";
        }

        IReadOnlyList<SecurityEvidencePathRankRecord> ranks =
            await rankRepository.ListBySnapshotAsync(
                ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), selectedPath.SnapshotId),
                cancellationToken);
        SecurityEvidencePathRankRecord[] ordered = ranks
            .OrderBy(rank => rank.RankOrder)
            .ToArray();
        int selectedIndex = Array.FindIndex(ordered, rank => rank.PathId == selectedPath.PathId);

        if (selectedIndex < 0 || selectedIndex + 1 >= ordered.Length)
        {
            return "No next stored path is available. This does not change the rank.";
        }

        SecurityEvidencePathRankRecord selected = ordered[selectedIndex];
        SecurityEvidencePathRankRecord next = ordered[selectedIndex + 1];
        (string Name, decimal Gap)[] dimensions =
        [
            ("TechnicalExposure", selected.TechnicalExposureScore - next.TechnicalExposureScore),
            ("PrivilegeDepth", selected.PrivilegeDepthScore - next.PrivilegeDepthScore),
            ("BlastRadius", selected.BlastRadiusScore - next.BlastRadiusScore),
            ("BusinessConsequence", (selected.BusinessConsequenceScore ?? 0m) - (next.BusinessConsequenceScore ?? 0m)),
            ("ConfidenceBand", selected.ConfidenceBandScore - next.ConfidenceBandScore),
        ];
        (string Name, decimal Gap)? largest = dimensions
            .Where(dimension => dimension.Gap > 0)
            .OrderByDescending(dimension => dimension.Gap)
            .FirstOrDefault();

        return largest is { } dimension
            ? $"Selected path {selected.PathId:D} outranks stored path {next.PathId:D} on {dimension.Name}. This does not change the rank."
            : $"Selected path {selected.PathId:D} does not outrank stored path {next.PathId:D} on a stored dimension. This does not change the rank.";
    }
}
