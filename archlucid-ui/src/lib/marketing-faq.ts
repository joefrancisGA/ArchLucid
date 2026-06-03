/**
 * Buyer-safe FAQ copy for /faq and FAQPage JSON-LD (TB-254). No new product claims beyond existing docs.
 */
export type MarketingFaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export const MARKETING_FAQ_ITEMS: ReadonlyArray<MarketingFaqItem> = [
  {
    id: "bulk-upload-30-files",
    question: "How many files can I upload in one bulk evidence batch?",
    answer:
      "In the operator run view, bulk evidence upload accepts up to 30 files per batch (product cap in the upload UI). For larger corpora, split batches or use your integration path per workspace policy.",
  },
  {
    id: "demo-workspaces",
    question: "What are demo workspaces?",
    answer:
      "Hosted trials and product-tour seeds provision a synthetic workspace with fabricated architecture context so you can explore analysis, findings, and governance flows without connecting production systems. The public self-demo link lands on a committed synthetic review run for the same purpose — not customer data.",
  },
  {
    id: "pricing-roadmap-notes",
    question: "What is on the pricing roadmap for diligence?",
    answer:
      "Items such as SCIM provisioning for directory-synchronized lifecycle are noted for procurement conversations; they are not committed ship dates on today's packaged tier cards.",
  },
  {
    id: "what-is-archlucid",
    question: "What is ArchLucid?",
    answer:
      "ArchLucid turns scattered architecture evidence into a prioritized, evidence-linked architecture review package — structured findings, traceability, and exportable outputs for enterprise architects and sponsors.",
  },
  {
    id: "who-is-it-for",
    question: "Who is ArchLucid for?",
    answer:
      "Enterprise and solution architects, architecture review boards, and executive sponsors who need defensible, evidence-linked review packages rather than slide-only opinions.",
  },
  {
    id: "azure-subscription",
    question: "Does ArchLucid require access to my Azure subscription?",
    answer:
      "Hosted SaaS does not require a customer Azure subscription for trial or standard product use. Optional read-only export packages can enrich cost narratives when buyers choose to supply them.",
  },
  {
    id: "assurance-posture",
    question: "What is ArchLucid's security assurance posture?",
    answer:
      "ArchLucid publishes control mapping aligned to SOC 2 criteria under internal security ownership. This is not a SOC 2 attestation report — see the Trust Center for current assurance materials.",
  },
  {
    id: "first-value-trial",
    question: "How does a trial reach first value?",
    answer:
      "Self-service trials can receive a vertical-specific welcome review that is created, executed, and committed in the background so evaluators land on a real committed package instead of an empty workspace.",
  },
  {
    id: "vs-chatgpt-copilot",
    question: "How is ArchLucid different from using ChatGPT or Copilot for architecture review?",
    answer:
      "General LLM chat can draft advice, but it does not commit a golden manifest, typed audit ledger, optional pre-commit governance gate, or traversable evidence chain for your tenant. ArchLucid is built for repeatable, sponsor-exportable architecture proof — see the vs chat assistant section on /why.",
  },
] as const;
