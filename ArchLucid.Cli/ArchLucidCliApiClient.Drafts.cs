using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Socratic intake draft calls (<c>/v1/architecture/draft</c>) behind <c>archlucid draft</c>.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    /// <summary>POST <c>/v1/architecture/draft</c> — create a mutable Socratic intake draft.</summary>
    public async Task<DraftApiResult<DraftRequestResponse>> CreateDraftAsync(
        string freeTextIntent,
        CancellationToken ct = default)
    {
        try
        {
            Gen.CreateDraftRequest bodyModel = new() { FreeTextIntent = freeTextIntent };
            Gen.Body35? body = MapToOpenApiRequestBody<Gen.Body35>(bodyModel, GenNumericEnumBridgeJson);
            Gen.DraftRequestResponse created = await _api.DraftPOSTAsync(body, ct);
            DraftRequestResponse? mapped = MapGeneratedToContract<DraftRequestResponse>(created);

            if (mapped is null)
                return DraftApiResult<DraftRequestResponse>.Fail(null, "Draft create returned an empty body.");

            return DraftApiResult<DraftRequestResponse>.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(null, "Request timed out.");
        }
    }

    /// <summary>PATCH <c>/v1/architecture/draft/{draftId}</c>.</summary>
    public async Task<DraftApiResult<DraftRequestResponse>> PatchDraftAsync(
        Guid draftId,
        PatchDraftRequest body,
        CancellationToken ct = default)
    {
        try
        {
            Gen.PatchDraftRequest? genBodyModel = MapContractToGenerated<Gen.PatchDraftRequest>(body);
            Gen.Body36? genBody = MapToOpenApiRequestBody<Gen.Body36>(genBodyModel, ContractEnumAwareJson);
            Gen.DraftRequestResponse patched = await _api.DraftPATCHAsync(draftId, genBody, ct);
            DraftRequestResponse? mapped = MapGeneratedToContract<DraftRequestResponse>(patched);

            if (mapped is null)
                return DraftApiResult<DraftRequestResponse>.Fail(null, "Draft patch returned an empty body.");

            return DraftApiResult<DraftRequestResponse>.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(null, "Request timed out.");
        }
    }

    /// <summary>POST <c>/v1/architecture/draft/{draftId}/admit</c>.</summary>
    public async Task<DraftApiResult<DraftAdmissionResponse>> AdmitDraftAsync(Guid draftId, CancellationToken ct = default)
    {
        try
        {
            Gen.DraftAdmissionResponse admitted = await _api.AdmitAsync(draftId, ct);
            DraftAdmissionResponse? mapped = MapGeneratedToContract<DraftAdmissionResponse>(admitted);

            if (mapped is null)
                return DraftApiResult<DraftAdmissionResponse>.Fail(null, "Draft admit returned an empty body.");

            return DraftApiResult<DraftAdmissionResponse>.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return DraftApiResult<DraftAdmissionResponse>.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return DraftApiResult<DraftAdmissionResponse>.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return DraftApiResult<DraftAdmissionResponse>.Fail(null, "Request timed out.");
        }
    }

    /// <summary>GET <c>/v1/architecture/draft/{draftId}/questions</c>.</summary>
    public async Task<DraftApiResult<DraftQuestionsResponse>> GetDraftQuestionsAsync(
        Guid draftId,
        CancellationToken ct = default)
    {
        try
        {
            Gen.DraftQuestionsResponse questions = await _api.QuestionsAsync(draftId, ct);
            DraftQuestionsResponse? mapped = MapGeneratedToContract<DraftQuestionsResponse>(questions);

            if (mapped is null)
                return DraftApiResult<DraftQuestionsResponse>.Fail(null, "Draft questions returned an empty body.");

            return DraftApiResult<DraftQuestionsResponse>.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return DraftApiResult<DraftQuestionsResponse>.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return DraftApiResult<DraftQuestionsResponse>.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return DraftApiResult<DraftQuestionsResponse>.Fail(null, "Request timed out.");
        }
    }

    /// <summary>POST answer for a draft elicitation question.</summary>
    public async Task<DraftApiResult<DraftRequestResponse>> AnswerDraftQuestionAsync(
        Guid draftId,
        AnswerDraftQuestionRequest body,
        CancellationToken ct = default)
    {
        try
        {
            Gen.AnswerDraftQuestionRequest? genBodyModel = MapContractToGenerated<Gen.AnswerDraftQuestionRequest>(body);
            Gen.Body37? genBody = MapToOpenApiRequestBody<Gen.Body37>(genBodyModel, ContractEnumAwareJson);
            Gen.DraftRequestResponse answered = await _api.AnswerAsync(draftId, genBody, ct);
            DraftRequestResponse? mapped = MapGeneratedToContract<DraftRequestResponse>(answered);

            if (mapped is null)
                return DraftApiResult<DraftRequestResponse>.Fail(null, "Draft answer returned an empty body.");

            return DraftApiResult<DraftRequestResponse>.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(null, "Request timed out.");
        }
    }

    /// <summary>POST skip for a draft elicitation question.</summary>
    public async Task<DraftApiResult<DraftRequestResponse>> SkipDraftQuestionAsync(
        Guid draftId,
        SkipDraftQuestionRequest body,
        CancellationToken ct = default)
    {
        try
        {
            Gen.SkipDraftQuestionRequest? genBodyModel = MapContractToGenerated<Gen.SkipDraftQuestionRequest>(body);
            Gen.Body40? genBody = MapToOpenApiRequestBody<Gen.Body40>(genBodyModel, ContractEnumAwareJson);
            Gen.DraftRequestResponse skipped = await _api.SkipAsync(draftId, genBody, ct);
            DraftRequestResponse? mapped = MapGeneratedToContract<DraftRequestResponse>(skipped);

            if (mapped is null)
                return DraftApiResult<DraftRequestResponse>.Fail(null, "Draft skip returned an empty body.");

            return DraftApiResult<DraftRequestResponse>.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return DraftApiResult<DraftRequestResponse>.Fail(null, "Request timed out.");
        }
    }

    /// <summary>POST <c>/v1/architecture/draft/{draftId}/submit</c> — spawn canonical architecture run.</summary>
    public async Task<DraftApiResult<SubmitDraftResponse>> SubmitDraftAsync(Guid draftId, CancellationToken ct = default)
    {
        try
        {
            Gen.SubmitDraftResponse submitted = await _api.SubmitAsync(draftId, ct);
            SubmitDraftResponse? mapped = MapGeneratedToContract<SubmitDraftResponse>(submitted);

            if (mapped is null)
                return DraftApiResult<SubmitDraftResponse>.Fail(null, "Draft submit returned an empty body.");

            return DraftApiResult<SubmitDraftResponse>.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return DraftApiResult<SubmitDraftResponse>.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return DraftApiResult<SubmitDraftResponse>.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return DraftApiResult<SubmitDraftResponse>.Fail(null, "Request timed out.");
        }
    }
}
