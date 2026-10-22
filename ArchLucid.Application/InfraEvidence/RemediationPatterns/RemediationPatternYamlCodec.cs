using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace ArchLucid.Application.InfraEvidence.RemediationPatterns;

public static class RemediationPatternYamlCodec
{
    private static readonly IDeserializer YamlDeserializer = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .IgnoreUnmatchedProperties()
        .Build();

    private static readonly ISerializer YamlSerializer = new SerializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .Build();

    public static RemediationPatternDraftRequest DeserializeDraftRequest(string yaml)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(yaml);

        RemediationPatternImportDocument? document = YamlDeserializer.Deserialize<RemediationPatternImportDocument>(yaml);

        if (document is null)
            throw new InvalidOperationException("YAML did not deserialize to a remediation pattern document.");

        return MapDocument(document);
    }

    public static string SerializeDraftRequest(RemediationPatternDraftRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        RemediationPatternImportDocument document = MapRequest(request);
        return YamlSerializer.Serialize(document);
    }

    public static RemediationPatternDraftRequest DeserializeDraftRequestFromJson(string json)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json);

        RemediationPatternImportDocument? document = JsonSerializer.Deserialize<RemediationPatternImportDocument>(
            json,
            AuditJsonSerializationOptions.Instance);

        if (document is null)
            throw new InvalidOperationException("JSON did not deserialize to a remediation pattern document.");

        return MapDocument(document);
    }

    private static RemediationPatternDraftRequest MapDocument(RemediationPatternImportDocument document) =>
        new()
        {
            PatternKey = document.PatternKey ?? string.Empty,
            DisplayName = document.DisplayName ?? string.Empty,
            Description = document.Description,
            Version = string.IsNullOrWhiteSpace(document.Version) ? "1.0.0" : document.Version,
            Content = document.Content ?? new RemediationPatternVersionContent(),
            MatchCriteria = document.MatchCriteria ?? new RemediationPatternMatchCriteria(),
            AutomationLevel = document.AutomationLevel,
        };

    private static RemediationPatternImportDocument MapRequest(RemediationPatternDraftRequest request) =>
        new()
        {
            PatternKey = request.PatternKey,
            DisplayName = request.DisplayName,
            Description = request.Description,
            Version = request.Version,
            Content = request.Content,
            MatchCriteria = request.MatchCriteria,
            AutomationLevel = request.AutomationLevel,
        };

    private sealed class RemediationPatternImportDocument
    {
        public string? PatternKey
        {
            get;
            set;
        }

        public string? DisplayName
        {
            get;
            set;
        }

        public string? Description
        {
            get;
            set;
        }

        public string? Version
        {
            get;
            set;
        }

        public RemediationPatternVersionContent? Content
        {
            get;
            set;
        }

        public RemediationPatternMatchCriteria? MatchCriteria
        {
            get;
            set;
        }

        public RemediationAutomationLevel AutomationLevel
        {
            get;
            set;
        }
    }
}
