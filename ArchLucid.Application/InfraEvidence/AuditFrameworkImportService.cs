using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AuditFrameworkCatalogDocument
{
    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string Version
    {
        get;
        init;
    } = string.Empty;

    public string SourceReference
    {
        get;
        init;
    } = string.Empty;

    public string? Publisher
    {
        get;
        init;
    }

    public DateOnly? EffectiveDate
    {
        get;
        init;
    }

    public IReadOnlyList<AuditFrameworkCatalogControlDocument> Controls
    {
        get;
        init;
    } = [];
}

public sealed class AuditFrameworkCatalogControlDocument
{
    public string ControlNumber
    {
        get;
        init;
    } = string.Empty;

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public string? Objective
    {
        get;
        init;
    }

    public string? Applicability
    {
        get;
        init;
    }

    public string? ControlType
    {
        get;
        init;
    }

    public string? ParentControlNumber
    {
        get;
        init;
    }

    public string? EvaluationGuidance
    {
        get;
        init;
    }

    public IReadOnlyDictionary<string, string> Metadata
    {
        get;
        init;
    } = new Dictionary<string, string>();
}

public interface IAuditFrameworkImportService
{
    Task<AuditFrameworkImportResult> ImportJsonAsync(
        Guid tenantId,
        string importedBy,
        string json,
        CancellationToken cancellationToken = default);
}

public sealed class AuditFrameworkImportService(IAuditFrameworkRepository repository) : IAuditFrameworkImportService
{
    public async Task<AuditFrameworkImportResult> ImportJsonAsync(
        Guid tenantId,
        string importedBy,
        string json,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new AuditFrameworkImportResult
            {
                Succeeded = false,
                ErrorCode = "EmptyPayload",
                ErrorMessage = "Catalog JSON is required.",
            };
        }

        AuditFrameworkCatalogDocument? document;

        try
        {
            document = JsonSerializer.Deserialize<AuditFrameworkCatalogDocument>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException ex)
        {
            return new AuditFrameworkImportResult
            {
                Succeeded = false,
                ErrorCode = "InvalidJson",
                ErrorMessage = ex.Message,
            };
        }

        if (document is null)
        {
            return new AuditFrameworkImportResult
            {
                Succeeded = false,
                ErrorCode = "InvalidJson",
                ErrorMessage = "Catalog JSON could not be parsed.",
            };
        }

        if (string.IsNullOrWhiteSpace(document.Version) || string.IsNullOrWhiteSpace(document.SourceReference))
        {
            return new AuditFrameworkImportResult
            {
                Succeeded = false,
                ErrorCode = "MissingVersionOrSource",
                ErrorMessage = "Version and SourceReference are required.",
            };
        }

        byte[] specBytes = Encoding.UTF8.GetBytes(json);
        byte[] contentHash = SHA256.HashData(specBytes);
        Guid frameworkId = Guid.NewGuid();
        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

        AuditFrameworkRecord framework = new()
        {
            FrameworkId = frameworkId,
            TenantId = tenantId,
            Name = string.IsNullOrWhiteSpace(document.Name) ? "Imported audit framework" : document.Name.Trim(),
            Version = document.Version.Trim(),
            Publisher = document.Publisher,
            EffectiveDate = document.EffectiveDate,
            SourceReference = document.SourceReference.Trim(),
            Status = AuditFrameworkStatus.Imported,
            ContentHashSha256 = contentHash,
            SpecBlob = specBytes,
            ImportedBy = importedBy,
            CreatedUtc = createdUtc,
        };

        Dictionary<string, Guid> controlNumberToId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<Guid, IReadOnlyDictionary<string, string>> metadataByControlId = new();

        foreach (AuditFrameworkCatalogControlDocument controlDoc in document.Controls)
        {
            Guid controlId = Guid.NewGuid();
            controlNumberToId[controlDoc.ControlNumber] = controlId;
            metadataByControlId[controlId] = controlDoc.Metadata;
        }

        List<AuditControlRecord> controls = document.Controls
            .Select(controlDoc =>
            {
                Guid controlId = controlNumberToId[controlDoc.ControlNumber];
                Guid? parentControlId = null;

                if (!string.IsNullOrWhiteSpace(controlDoc.ParentControlNumber)
                    && controlNumberToId.TryGetValue(controlDoc.ParentControlNumber, out Guid parentId))
                {
                    parentControlId = parentId;
                }

                return new AuditControlRecord
                {
                    ControlId = controlId,
                    FrameworkId = frameworkId,
                    TenantId = tenantId,
                    ControlNumber = controlDoc.ControlNumber,
                    Title = controlDoc.Title,
                    Description = controlDoc.Description,
                    Objective = controlDoc.Objective,
                    Applicability = controlDoc.Applicability,
                    ControlType = controlDoc.ControlType,
                    ParentControlId = parentControlId,
                    EvaluationGuidance = controlDoc.EvaluationGuidance,
                };
            })
            .ToList();

        return await repository.ImportAsync(tenantId, framework, controls, metadataByControlId, cancellationToken);
    }
}
