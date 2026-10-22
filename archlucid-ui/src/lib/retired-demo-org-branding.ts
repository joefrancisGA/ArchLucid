/**
 * M-135 / TB-982: Contoso/Northwind were retired from buyer-facing demo labels.
 * Apply on read so stale seeded descriptions never reach operator chrome.
 */
const REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /Demo — Contoso retail hardened manifest \(trusted baseline seed\)\./g,
    "Demo — Retail hardened manifest (trusted baseline seed).",
  ],
  [
    /Demo — Contoso retail baseline manifest \(trusted baseline seed\)\./g,
    "Demo — Retail baseline manifest (trusted baseline seed).",
  ],
  [/Contoso Retail Platform/g, "Retail Checkout Platform"],
  [/Contoso Online Store/g, "Retail Online Store"],
  [/Contoso Cloud Platform/g, "Cloud Platform"],
  [
    /Contoso Retail modernization — migrate monolith checkout to Azure with PCI-aware boundaries\./g,
    "Retail modernization — migrate monolith checkout to Azure with PCI-aware boundaries.",
  ],
  [/Contoso Retail/g, "Retail Checkout"],
  [
    /Northwind Architects — Workspace A Product Tour \(synthetic Contoso Cloud Platform review\)\./g,
    "Product Tour — Workspace A (synthetic Cloud Platform review).",
  ],
  [
    /Northwind Architects — Workspace A Product Tour \(synthetic Cloud Platform review\)\./g,
    "Product Tour — Workspace A (synthetic Cloud Platform review).",
  ],
  [
    // Match legacy seeded copy; replacement must stay free of banned package nouns (TB-355).
    /Northwind Copilot RAG platform — finalized created architecture package \(synthetic guided-intake sample\)\./g,
    "Enterprise Copilot RAG platform — finalized created architecture review (synthetic guided-intake sample).",
  ],
  [/Northwind\.Copilot\.RagPlatform/g, "Enterprise.Copilot.RagPlatform"],
  [/Northwind Copilot RAG Platform/g, "Enterprise Copilot RAG Platform"],
  [/Northwind Traders/g, "Enterprise sample"],
  [/Northwind Architects/g, "Product Tour reviewer"],
];

export function stripRetiredDemoOrgBranding(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  let next = value;

  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next;
}
