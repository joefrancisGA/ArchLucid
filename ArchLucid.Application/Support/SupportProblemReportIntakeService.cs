using System.Text.Json;

using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Support;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;

namespace ArchLucid.Application.Support;

public sealed class SupportProblemReportIntakeService(
    ISupportProblemReportRepository reports,
    ISupportProblemReportNotifier notifier,
    TimeProvider timeProvider) : ISupportProblemReportIntakeService
{
    public const string SlaMessage = "We'll respond by the next business day.";

    private const int MaxOperatorNoteLength = 2000;

    private const int MaxShortFieldLength = 256;

    private const int MaxBrowserClientLength = 512;

    private static readonly JsonSerializerOptions ContextJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    private readonly ISupportProblemReportRepository _reports =
        reports ?? throw new ArgumentNullException(nameof(reports));

    private readonly ISupportProblemReportNotifier _notifier =
        notifier ?? throw new ArgumentNullException(nameof(notifier));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<SubmitSupportProblemReportResponse> SubmitAsync(
        ScopeContext scope,
        string submittedByActorId,
        SubmitSupportProblemReportRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(submittedByActorId);
        ArgumentNullException.ThrowIfNull(request);

        if (!request.ConsentGranted)
        {
            throw new SupportProblemReportConsentRequiredException();
        }

        if (request.Context is null)
        {
            throw new SupportProblemReportValidationException("Context is required.");
        }

        ValidateScopeAlignment(scope, request.Context);

        string? operatorNote = NormalizeOptional(request.OperatorNote, MaxOperatorNoteLength, nameof(request.OperatorNote));
        ReportProblemContextDto envelope = BuildRedactedEnvelope(scope, request.Context);
        string contextJson = JsonSerializer.Serialize(envelope, ContextJsonOptions);

        SupportProblemReportInsert insert = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SubmittedByActorId = submittedByActorId.Trim(),
            ContextJson = contextJson,
            OperatorNote = operatorNote,
            CorrelationId = envelope.CorrelationId,
            ClientRequestId = envelope.ClientRequestId,
            SupportBundleBlobPath = null
        };

        SupportProblemReportRecord created = await _reports.InsertAsync(insert, cancellationToken).ConfigureAwait(false);

        await _notifier.NotifySupportInboxAsync(created, submittedByActorId.Trim(), cancellationToken)
            .ConfigureAwait(false);

        return new SubmitSupportProblemReportResponse
        {
            ReferenceId = created.Id,
            SubmittedAtUtc = created.CreatedUtc,
            SlaMessage = SlaMessage
        };
    }

    private static void ValidateScopeAlignment(ScopeContext scope, ReportProblemContextDto context)
    {
        if (TryParseGuid(context.TenantId, out Guid contextTenantId) && contextTenantId != scope.TenantId)
        {
            throw new SupportProblemReportScopeMismatchException(
                "Context tenantId does not match the active tenant scope.");
        }

        if (TryParseGuid(context.WorkspaceId, out Guid contextWorkspaceId) && contextWorkspaceId != scope.WorkspaceId)
        {
            throw new SupportProblemReportScopeMismatchException(
                "Context workspaceId does not match the active workspace scope.");
        }
    }

    private static ReportProblemContextDto BuildRedactedEnvelope(ScopeContext scope, ReportProblemContextDto source)
    {
        return new ReportProblemContextDto
        {
            ReviewId = NormalizeOptional(source.ReviewId, MaxShortFieldLength, "reviewId"),
            TenantId = scope.TenantId.ToString("D"),
            WorkspaceId = scope.WorkspaceId.ToString("D"),
            ProductVersion = NormalizeOptional(source.ProductVersion, MaxShortFieldLength, "productVersion"),
            UiVersion = NormalizeOptional(source.UiVersion, MaxShortFieldLength, "uiVersion"),
            BrowserClient = NormalizeOptional(source.BrowserClient, MaxBrowserClientLength, "browserClient"),
            CorrelationId = NormalizeOptional(source.CorrelationId, MaxShortFieldLength, "correlationId"),
            ClientRequestId = NormalizeOptional(source.ClientRequestId, MaxShortFieldLength, "clientRequestId"),
            RoutePath = NormalizeOptional(source.RoutePath, MaxShortFieldLength, "routePath"),
            ErrorCode = NormalizeOptional(source.ErrorCode, MaxShortFieldLength, "errorCode"),
            ErrorTitle = NormalizeOptional(source.ErrorTitle, MaxShortFieldLength, "errorTitle"),
            HttpStatus = NormalizeHttpStatus(source.HttpStatus),
            SubmittedAtUtc = NormalizeSubmittedAtUtc(source.SubmittedAtUtc)
        };
    }

    private static int? NormalizeHttpStatus(int? httpStatus)
    {
        if (httpStatus is null)
        {
            return null;
        }

        if (httpStatus < 100 || httpStatus > 599)
        {
            throw new SupportProblemReportValidationException("httpStatus must be between 100 and 599 when provided.");
        }

        return httpStatus;
    }

    private static string? NormalizeSubmittedAtUtc(string? submittedAtUtc)
    {
        string? normalized = NormalizeOptional(submittedAtUtc, MaxShortFieldLength, "submittedAtUtc");

        if (normalized is null)
        {
            return null;
        }

        if (!DateTimeOffset.TryParse(normalized, out _))
        {
            throw new SupportProblemReportValidationException("submittedAtUtc must be an ISO-8601 timestamp when provided.");
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? value, int maxLength, string fieldName)
    {
        if (value is null)
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length == 0)
        {
            return null;
        }

        if (trimmed.Length > maxLength)
        {
            throw new SupportProblemReportValidationException($"{fieldName} exceeds the maximum length of {maxLength}.");
        }

        return trimmed;
    }

    private static bool TryParseGuid(string? value, out Guid parsed)
    {
        parsed = Guid.Empty;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return Guid.TryParse(value.Trim(), out parsed);
    }
}
