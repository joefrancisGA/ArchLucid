namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     M-135 / TB-982: Contoso/Northwind were retired from buyer-facing demo labels.
///     Apply on seed repair and on read-path projections so stale SQL rows never leak.
/// </summary>
public static class RetiredDemoOrgBranding
{
    public static string? Strip(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return value;

        string next = value;
        next = next.Replace(
            "Demo — Contoso retail hardened manifest (trusted baseline seed).",
            "Demo — Retail hardened manifest (trusted baseline seed).",
            StringComparison.Ordinal);
        next = next.Replace(
            "Demo — Contoso retail baseline manifest (trusted baseline seed).",
            "Demo — Retail baseline manifest (trusted baseline seed).",
            StringComparison.Ordinal);
        next = next.Replace("Contoso Retail Platform", "Retail Checkout Platform", StringComparison.Ordinal);
        next = next.Replace("Contoso Online Store", "Retail Online Store", StringComparison.Ordinal);
        next = next.Replace("Contoso Cloud Platform", "Cloud Platform", StringComparison.Ordinal);
        next = next.Replace(
            "Contoso Retail modernization — migrate monolith checkout to Azure with PCI-aware boundaries.",
            "Retail modernization — migrate monolith checkout to Azure with PCI-aware boundaries.",
            StringComparison.Ordinal);
        next = next.Replace("Contoso Retail", "Retail Checkout", StringComparison.Ordinal);
        next = next.Replace(
            "Northwind Architects — Workspace A Product Tour (synthetic Contoso Cloud Platform review).",
            "Product Tour — Workspace A (synthetic Cloud Platform review).",
            StringComparison.Ordinal);
        next = next.Replace(
            "Northwind Architects — Workspace A Product Tour (synthetic Cloud Platform review).",
            "Product Tour — Workspace A (synthetic Cloud Platform review).",
            StringComparison.Ordinal);
        next = next.Replace(
            "Northwind Copilot RAG platform — born-governed created architecture package (synthetic guided-intake sample).",
            "Enterprise Copilot RAG platform — born-governed created architecture package (synthetic guided-intake sample).",
            StringComparison.Ordinal);
        next = next.Replace("Northwind.Copilot.RagPlatform", "Enterprise.Copilot.RagPlatform", StringComparison.Ordinal);
        next = next.Replace("Northwind Copilot RAG Platform", "Enterprise Copilot RAG Platform", StringComparison.Ordinal);
        next = next.Replace("Northwind Traders", "Enterprise sample", StringComparison.Ordinal);
        next = next.Replace("Northwind Architects", "Product Tour reviewer", StringComparison.Ordinal);

        return next;
    }
}
