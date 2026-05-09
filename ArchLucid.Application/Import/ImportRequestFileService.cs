using System.Text;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Import;

public sealed class ImportRequestFileService(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    IImportedArchitectureRequestRepository importedRequestRepository,
    IArchitectureRequestImportValidator architectureRequestImportValidator,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    ILogger<ImportRequestFileService> logger) : IImportRequestFileService
{
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IImportedArchitectureRequestRepository _importedRequestRepository =
        importedRequestRepository ?? throw new ArgumentNullException(nameof(importedRequestRepository));

    private readonly ILogger<ImportRequestFileService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IArchitectureRequestImportValidator _architectureRequestImportValidator =
        architectureRequestImportValidator ?? throw new ArgumentNullException(nameof(architectureRequestImportValidator));

    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck =
        requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));

    private const int MaxFileBytes = 512 * 1024;
    private const int MaxSourceFileNameLength = 400;

    public async Task<ImportRequestFileResult> ImportAsync(IFormFile? file, CancellationToken ct, string? correlationId = null)
    {
        ct.ThrowIfCancellationRequested();
        if (file is null)
            return Fail("No file was uploaded (expected form field 'file').");
        if (string.IsNullOrWhiteSpace(file.FileName))
            return Fail("Uploaded file must include a name with a .json or .toml extension.");
        if (!TryGetFormat(file.FileName, out string format, out string? formatError))
            return Fail(formatError!);
        if (file.Length > MaxFileBytes)
            return Fail($"File exceeds maximum size of {MaxFileBytes} bytes.");
        string text;
        try
        {
            text = await ReadUtf8CappedAsync(file, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to read import file {FileName}.", file.FileName);
            return Fail("Could not read uploaded file as UTF-8 text.");
        }

        if (text.Length > MaxFileBytes)
            return Fail($"File exceeds maximum size of {MaxFileBytes} bytes.");
        ArchitectureRequest request;
        try
        {
            request = DeserializeForImport(text, format);
        }
        catch (Exception ex)when (ex is JsonException or InvalidOperationException)
        {
            logger.LogWarning(ex, "Import file {FileName} failed to deserialize as {Format}.", file.FileName, format);
            return Fail($"File is not valid {format}: {ex.Message}");
        }

        RequestContentSafetyResult safety = await requestContentSafetyPrecheck.EvaluateAsync(request, ct);
        if (!safety.IsAllowed)
        {
            return new ImportRequestFileResult
            {
                Succeeded = false, FailureDetail = "Request content failed safety precheck.", ContentSafetyReasons = safety.Reasons
            };
        }

        ArchitectureRequestImportValidationResult validation = await architectureRequestImportValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return new ImportRequestFileResult
            {
                Succeeded = false, FailureDetail = "Imported request failed validation.", ValidationErrors = validation.Errors
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string actor = actorContext.GetActor();
        string safeName = Path.GetFileName(file.FileName.Trim());
        if (safeName.Length > MaxSourceFileNameLength)
            safeName = safeName[..MaxSourceFileNameLength];
        string requestJson = JsonSerializer.Serialize(request, ImportArchitectureRequestSerializerOptions.StrictDeserialize);
        Guid importId = Guid.NewGuid();
        ImportedArchitectureRequestRecord record = new()
        {
            ImportId = importId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            SourceFileName = safeName,
            Format = format,
            Status = "Draft",
            RequestJson = requestJson
        };
        await importedRequestRepository.InsertAsync(record, ct);
        object payload = new { importId, requestId = request.RequestId, format, sourceFileName = safeName };
        string dataJson = JsonSerializer.Serialize(payload, ContractJson.CamelCaseCompact);
        AuditEvent imported = scope.CreateAuditEvent(AuditEventTypes.RequestFileImported, actor, actor, dataJson);
        imported.CorrelationId = correlationId;

        await auditService.LogAsync(imported, ct);
        return new ImportRequestFileResult { Succeeded = true, ImportedRequestId = importId, Status = "Draft", Warnings = [] };
    }

    private static ImportRequestFileResult Fail(string detail)
    {
        return new ImportRequestFileResult { Succeeded = false, FailureDetail = detail };
    }

    private static bool TryGetFormat(string fileName, out string format, out string? error)
    {
        error = null;
        format = string.Empty;
        string ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
        if (ext is "json")
        {
            format = "json";
            return true;
        }

        if (ext is "toml")
        {
            format = "toml";
            return true;
        }

        error = "File must have a .json or .toml extension.";
        return false;
    }

    private static ArchitectureRequest DeserializeForImport(string text, string format)
    {
        return string.Equals(format, "json", StringComparison.OrdinalIgnoreCase)
            ? JsonRequestDeserializer.DeserializeText(text)
            : TomlRequestDeserializer.Deserialize(text);
    }

    private static async Task<string> ReadUtf8CappedAsync(IFormFile file, CancellationToken ct)
    {
        await using Stream stream = file.OpenReadStream();
        using MemoryStream ms = new(Math.Min(MaxFileBytes, 64 * 1024));
        byte[] buffer = new byte[8192];
        int total = 0;
        while (true)
        {
            int read = await stream.ReadAsync(buffer, ct);
            if (read == 0)
                break;
            total += read;
            if (total > MaxFileBytes)
                throw new InvalidOperationException($"Import file exceeds maximum size of {MaxFileBytes} bytes.");
            ms.Write(buffer, 0, read);
        }

        return Encoding.UTF8.GetString(ms.ToArray());
    }
}
