using ArchLucid.Application.InfraEvidence.Ask;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class InfraEvidenceAskGroundingService(
    IInfraEvidenceAskEvidenceCollector evidenceCollector,
    IAgentCompletionClient llm,
    IPromptRedactor promptRedactor,
    IArchitectureDiagramReconciliationRepository reconciliationRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<InfraEvidenceAskGroundingService> logger) : IInfraEvidenceAskGroundingService
{
    public async Task<InfraEvidenceAskGroundingResult> TryAnswerAsync(
        ScopeContext scope,
        InfraEvidenceAskRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Question))
        {
            return new InfraEvidenceAskGroundingResult
            {
                Succeeded = false,
                ErrorMessage = "Question is required.",
            };
        }

        try
        {
            await InfraEvidenceAskSealedManifestHashGuard.EnsureAskSealedManifestHashOrThrowAsync(
                request,
                scope,
                reconciliationRepository,
                authorityQueryService,
                manifestHashService,
                cancellationToken);

            string topicKind = InfraEvidenceAskIntentResolver.Resolve(request);

            InfraEvidenceAskEvidenceBundle bundle =
                await evidenceCollector.CollectAsync(scope, request, topicKind, cancellationToken);

            if (!bundle.HasEvidence)
            {
                return new InfraEvidenceAskGroundingResult
                {
                    Succeeded = true,
                    Response = new InfraEvidenceAskResponse
                    {
                        TopicKind = topicKind,
                        InsufficientEvidence = true,
                        Answer =
                            "Insufficient structured evidence is available in the current scope to answer this question. "
                            + "No Azure resource ids were inferred.",
                    },
                };
            }

            HashSet<string> allowedSeedNodeIds = DiagramViewPlanValidator.ExtractAllowedSeedNodeIds(bundle);

            if (request.UseSimulator)
            {
                DiagramViewPlan? simulatorPlan =
                    InfraEvidenceAskPromptBuilder.BuildSimulatorViewPlan(request.Question, request, bundle);

                if (topicKind == InfraEvidenceAskTopicKinds.DiagramView
                    && (simulatorPlan is null
                        || !DiagramViewPlanValidator.TryValidate(simulatorPlan, allowedSeedNodeIds, out _)))
                {
                    return new InfraEvidenceAskGroundingResult
                    {
                        Succeeded = true,
                        Response = new InfraEvidenceAskResponse
                        {
                            TopicKind = topicKind,
                            InsufficientEvidence = true,
                            Answer =
                                "Insufficient structured evidence is available to propose a diagram view in the current scope. "
                                + "No ARM resource ids or seed nodes were inferred.",
                            Citations = InfraEvidenceAskPromptBuilder.SelectSimulatorCitations(bundle).ToList(),
                            SimulatorLabel = InfraEvidenceAskPromptBuilder.SimulatorLabel,
                        },
                    };
                }

                return new InfraEvidenceAskGroundingResult
                {
                    Succeeded = true,
                    Response = new InfraEvidenceAskResponse
                    {
                        TopicKind = topicKind,
                        Answer = InfraEvidenceAskPromptBuilder.BuildSimulatorAnswer(request.Question, bundle),
                        Citations = InfraEvidenceAskPromptBuilder.SelectSimulatorCitations(bundle).ToList(),
                        SimulatorLabel = InfraEvidenceAskPromptBuilder.SimulatorLabel,
                        ViewPlan = simulatorPlan,
                    },
                };
            }

            string userPrompt = InfraEvidenceAskPromptBuilder.BuildUserPrompt(request.Question, topicKind, bundle);
            PromptRedactionOutcome redactedPrompt = promptRedactor.Redact(userPrompt);

            string llmJson = await llm.CompleteJsonAsync(
                InfraEvidenceAskPromptBuilder.BuildSystemPrompt(),
                redactedPrompt.Text,
                maxTokens: null,
                cancellationToken: cancellationToken);

            if (!InfraEvidenceAskPromptBuilder.TryParseLlmResponse(
                    llmJson,
                    bundle,
                    out string answer,
                    out IReadOnlyList<InfraEvidenceAskCitation> citations,
                    out DiagramViewPlan? viewPlan))
            {
                return new InfraEvidenceAskGroundingResult
                {
                    Succeeded = false,
                    ErrorMessage = "LLM response could not be parsed into a grounded answer with citations.",
                };
            }

            if (viewPlan is not null
                && !DiagramViewPlanValidator.TryValidate(viewPlan, allowedSeedNodeIds, out _))
            {
                viewPlan = null;
            }

            if (topicKind == InfraEvidenceAskTopicKinds.DiagramView && viewPlan is null)
            {
                return new InfraEvidenceAskGroundingResult
                {
                    Succeeded = true,
                    Response = new InfraEvidenceAskResponse
                    {
                        TopicKind = topicKind,
                        InsufficientEvidence = true,
                        Answer =
                            "Insufficient structured evidence is available to propose a validated diagram view. "
                            + "No ARM resource ids were invented.",
                        Citations = citations.ToList(),
                    },
                };
            }

            return new InfraEvidenceAskGroundingResult
            {
                Succeeded = true,
                Response = new InfraEvidenceAskResponse
                {
                    TopicKind = topicKind,
                    Answer = answer,
                    Citations = citations.ToList(),
                    ViewPlan = viewPlan,
                },
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
            logger.LogWarning(ex, "Infra-evidence Ask grounding failed.");

            return new InfraEvidenceAskGroundingResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }
}
