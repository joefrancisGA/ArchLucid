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
    ILogger<SecurityEvidencePathExplanationService> logger) : ISecurityEvidencePathExplanationService
{
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
                await pathRepository.TryGetByIdAsync(scope.TenantId, pathId, cancellationToken);

            if (path is null
                || path.WorkspaceId != scope.WorkspaceId
                || path.ProjectId != scope.ProjectId)
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
                await pathRepository.ListHopsByPathAsync(scope.TenantId, pathId, cancellationToken);

            if (hops.Count == 0)
            {
                return new SecurityEvidencePathExplanationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Path explanation generation requires at least one hop.",
                };
            }

            IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints =
                await cutPointRepository.ListByPathIdAsync(scope.TenantId, pathId, cancellationToken);

            IReadOnlyList<string> allowedEvidenceRefs =
                SecurityEvidencePathExplanationValidator.SelectAllowedEvidenceRefs(pathId, hops);

            HashSet<string> allowedArmIds = SecurityEvidencePathExplanationValidator.CollectAllowedArmIds(hops);
            SecurityEvidencePathExplanationTemplateResponse explanationTemplate =
                SecurityEvidencePathExplanationTemplateBuilder.Build(path, hops);

            SecurityEvidencePathExplanationContent content;
            ProvenanceKind provenanceKind;
            string? simulatorLabel = null;

            if (useSimulator)
            {
                content = SecurityEvidencePathExplanationBuilder.BuildSimulatorExplanation(
                    path,
                    hops,
                    cutPoints,
                    allowedEvidenceRefs);

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
                    allowedEvidenceRefs);

                PromptRedactionOutcome redactedPrompt = promptRedactor.Redact(userPrompt);

                string llmJson = await llm.CompleteJsonAsync(
                    ExplanationSystemPrompt,
                    redactedPrompt.Text,
                    maxTokens: null,
                    cancellationToken: cancellationToken);

                if (!SecurityEvidencePathExplanationBuilder.TryParseLlmResponse(
                        llmJson,
                        allowedEvidenceRefs,
                        allowedArmIds,
                        out content,
                        out string? rejectionReason))
                {
                    return new SecurityEvidencePathExplanationResult
                    {
                        Succeeded = false,
                        ErrorMessage = rejectionReason ?? "Path explanation could not be validated against cited evidence.",
                    };
                }

                provenanceKind = ProvenanceKind.AiInference;
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
}
