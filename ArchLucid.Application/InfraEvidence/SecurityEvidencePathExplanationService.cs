using ArchLucid.Application;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecurityEvidencePathExplanationService(
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidenceCutPointRepository cutPointRepository,
    ISecurityEvidencePathExplanationRepository explanationRepository,
    IAgentCompletionClient llm,
    IPromptRedactor promptRedactor,
    ILogger<SecurityEvidencePathExplanationService> logger,
    ISecurityEvidencePathRankRepository? rankRepository = null,
    IAzureInventorySnapshotRepository? snapshotRepository = null,
    TimeProvider? timeProvider = null,
    IOptions<ArchitectureIntelligencePipelineOptions>? verificationOptions = null,
    ILlmCostEstimator? costEstimator = null) : ISecurityEvidencePathExplanationService
{
    public const int PathExplanationMaxOutputTokens = 800;

    private readonly SemanticVerificationBudget _verificationBudget = new(
        verificationOptions?.Value ?? new(), costEstimator);

    private const string ExplanationSystemPrompt =
        "You are an enterprise cloud security architect summarizing a cited SecureNow architect path. "
        + "Return ONLY JSON with keys executiveSummary, businessImpactHypotheses, proposedRemediation, citedEvidenceRefs, "
        + "and optional publicNetworkAccessDisabledHopOrdinal. "
        + "Use ONLY allowedEvidenceRefs for citedEvidenceRefs. "
        + "If proposing that an Azure resource has public network access disabled, put its hop ordinal in "
        + "publicNetworkAccessDisabledHopOrdinal. Use a hop marked hasInventoryResource with a cited evidence reference. "
        + "Keep the setting and any conclusions based on it out of free text. "
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

            if (path is null || path.PathId != pathId || path.TenantId != scope.TenantId ||
                path.WorkspaceId != scope.WorkspaceId || path.ProjectId != scope.ProjectId)
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
                    cancellationToken.ThrowIfCancellationRequested();
                    // A stored crown-jewel assertion identifies a material path without trusting model output.
                    bool material = path.CrownJewelAssertionId.HasValue;
                    TimeSpan timeout = _verificationBudget.Reserve(
                        ExplanationSystemPrompt, redactedPrompt.Text, material,
                        maxInputTokens: material ? 16_384 : 8_192, outputTokens: PathExplanationMaxOutputTokens);
                    string llmJson = await SemanticVerificationBudget.RunWithDeadlineAsync(
                        timeout, timeProvider ?? TimeProvider.System,
                        token => llm.CompleteJsonAsync(
                            ExplanationSystemPrompt,
                            redactedPrompt.Text,
                            maxTokens: PathExplanationMaxOutputTokens,
                            cancellationToken: token),
                        cancellationToken);

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
                    string? budgetReason = ex switch
                    {
                        SemanticVerificationDeferredException deferred => deferred.Message,
                        LlmTokenQuotaExceededException => "The tenant AI spending or token allowance denied verification.",
                        CostLimitExceededException => "The run AI spending or token allowance was exhausted.",
                        _ => null,
                    };
                    if (budgetReason is null)
                    {
                        logger.LogWarning(
                            ex,
                            "Model path explanation failed; using stored-path summary for PathId={PathId}.",
                            pathId);
                    }
                    content = SecurityEvidencePathExplanationBuilder.BuildSimulatorExplanation(
                        path,
                        hops,
                        cutPoints,
                        allowedEvidenceRefs,
                        rankContext);
                    provenanceKind = ProvenanceKind.DeterministicInference;
                    simulatorLabel = SecurityEvidencePathExplanationBuilder.SimulatorLabel;
                    modelOutputRejection = budgetReason is null
                        ? "Model completion failed; showing the stored-path summary."
                        : $"{budgetReason} The model claim remains unverified. Showing the stored-path summary.";
                }
            }

            string? configurationFact = null;
            if (provenanceKind == ProvenanceKind.AiInference &&
                (content.PublicNetworkAccessDisabledHopOrdinal.HasValue || MentionsPublicNetworkAccess(content)))
            {
                PublicNetworkAccessVerification? verification = await VerifyPublicNetworkAccessAsync(
                    scope, path, hops, content, cancellationToken);
                content = SecurityEvidencePathExplanationBuilder.BuildSimulatorExplanation(
                    path, hops, cutPoints, allowedEvidenceRefs, rankContext);
                provenanceKind = ProvenanceKind.DeterministicInference;
                simulatorLabel = SecurityEvidencePathExplanationBuilder.SimulatorLabel;

                InventoryFalsificationProbe probe = PublicNetworkAccessCounterexample.Evaluate(
                    verification, hasResourceBinding: verification is not null);
                switch (probe.Outcome)
                {
                    case InventoryFalsificationOutcome.SurvivedWithinTestedScope:
                        var evidence = verification!.Evidence!;
                        configurationFact = $" Azure inventory snapshot {verification.SnapshotId:D} "
                            + $"captured at {verification.CapturedUtc:O} records publicNetworkAccess=Disabled "
                            + $"for resource {verification.CloudResourceId:D} (inventory row {evidence.ResourceRowId:D}). "
                            + $"Deterministic verification: {evidence.VerifierVersion}; "
                            + $"maximum capture age at verification: {evidence.MaximumCaptureAgeHours} hours. "
                            + "Coverage: the explicit Azure property only. The hypothesis survived within the tested scope.";
                        break;
                    case InventoryFalsificationOutcome.Refuted:
                        modelOutputRejection = $"Refuted by the scoped Azure inventory: {verification!.SnapshotId:D}, "
                            + $"resource {verification.CloudResourceId:D}, inventory row {verification.Evidence!.ResourceRowId:D}, "
                            + $"captured {verification.CapturedUtc:O}. The public network access claim was contradicted. "
                            + probe.Coverage;
                        break;
                    case InventoryFalsificationOutcome.HumanReviewRequired:
                        modelOutputRejection = "Human review required. The public network access claim remains unverified without a cited resource.";
                        break;
                    default:
                        modelOutputRejection = "Untestable. The public network access claim remains unverified in the path inventory snapshot.";
                        break;
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
                ExecutiveSummary = content.ExecutiveSummary + configurationFact,
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

    private async Task<PublicNetworkAccessVerification?> VerifyPublicNetworkAccessAsync(
        ScopeContext scope,
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        SecurityEvidencePathExplanationContent content,
        CancellationToken cancellationToken)
    {
        if (snapshotRepository is null || content.PublicNetworkAccessDisabledHopOrdinal is not > 0)
            return null;

        SecurityEvidencePathHopRecord[] matches = hops.Where(
            hop => hop.HopOrdinal == content.PublicNetworkAccessDisabledHopOrdinal).Take(2).ToArray();
        if (matches.Length != 1 || matches[0].PathId != path.PathId || matches[0].TenantId != scope.TenantId ||
            matches[0].CloudResourceId is not Guid resourceId || string.IsNullOrWhiteSpace(matches[0].EvidenceReference) ||
            !content.CitedEvidenceRefs.Contains(matches[0].EvidenceReference.Trim(), StringComparer.OrdinalIgnoreCase))
            return null;

        return await InventoryPublicNetworkAccessVerifier.VerifyAsync(
            snapshotRepository, scope, path.SnapshotId, resourceId, timeProvider ?? TimeProvider.System, cancellationToken);
    }

    private static bool MentionsPublicNetworkAccess(SecurityEvidencePathExplanationContent content)
    {
        static bool MentionsSetting(string? text) =>
            text is not null && (text.Contains("publicNetworkAccess", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("public network access", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("public-network-access", StringComparison.OrdinalIgnoreCase) ||
                text.Contains("public_network_access", StringComparison.OrdinalIgnoreCase));

        return MentionsSetting(content.ExecutiveSummary) ||
            content.BusinessImpactHypotheses.Any(MentionsSetting) ||
            MentionsSetting(content.ProposedRemediation.RecommendedChange) ||
            MentionsSetting(content.ProposedRemediation.RecommendedChangeSource) ||
            MentionsSetting(content.ProposedRemediation.SuggestedPatternKey) ||
            content.ProposedRemediation.VerificationQueries.Any(MentionsSetting) ||
            content.ProposedRemediation.Preconditions.Any(MentionsSetting);
    }

    private static async Task<string> BuildRankContextAsync(
        ScopeContext scope,
        SecurityEvidencePathRecord selectedPath,
        ISecurityEvidencePathRankRepository? rankRepository,
        CancellationToken cancellationToken)
    {
        if (rankRepository is null)
        {
            return SecurityEvidencePathRankContextBuilder.NoNextStoredPathSentence;
        }

        IReadOnlyList<SecurityEvidencePathRankRecord> ranks =
            await rankRepository.ListBySnapshotAsync(
                ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), selectedPath.SnapshotId),
                cancellationToken);

        return SecurityEvidencePathRankContextBuilder.BuildNextStoredPathRankContext(selectedPath.PathId, ranks);
    }
}
