namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>LLM-backed Markdown explainer for raw policy pack JSON.</summary>
public interface IPolicyPackMarkdownExplainService
{
    Task<string> SummarizePackJsonAsync(string packDisplayName, string contentJson, CancellationToken ct);
}
