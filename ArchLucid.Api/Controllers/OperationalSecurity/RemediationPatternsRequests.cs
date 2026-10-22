using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

public sealed class RemediationPatternDraftApiRequest
{
    public string PatternKey
    {
        get;
        init;
    } = string.Empty;

    public string DisplayName
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public string Version
    {
        get;
        init;
    } = "1.0.0";

    public RemediationPatternVersionContent Content
    {
        get;
        init;
    } = new();

    public RemediationPatternMatchCriteria MatchCriteria
    {
        get;
        init;
    } = new();

    public RemediationAutomationLevel AutomationLevel
    {
        get;
        init;
    } = RemediationAutomationLevel.Manual;
}

public sealed class RemediationPatternImportYamlRequest
{
    public string Yaml
    {
        get;
        init;
    } = string.Empty;
}

public sealed class RemediationPatternImportJsonRequest
{
    public string Json
    {
        get;
        init;
    } = string.Empty;
}

public sealed class RemediationPatternBulkImportRequest
{
    public List<RemediationPatternDraftApiRequest> Items
    {
        get;
        init;
    } = [];
}

public sealed class RemediationPatternVersionActionRequest
{
    public string Version
    {
        get;
        init;
    } = string.Empty;
}
