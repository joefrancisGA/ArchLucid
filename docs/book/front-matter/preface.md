> **Scope:** Preface first draft for the book draft *Managing Azure Security with AI*: who the book is for, what it teaches, how to read it, and the conventions it uses. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Preface

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md) · **Glossary:** [`../back-matter/glossary.md`](../back-matter/glossary.md)

> *Draft status: first draft. See the author notes at the end.*

Most Azure estates are already inspected by tools that produce long lists of findings. Many are now also summarized by language models that turn those lists, or the raw configuration behind them, into confident paragraphs. Both are useful. Neither, on its own, answers the question a security team is paid to answer: **who can reach what, how do we know, and did our fix actually close it?**

This book is about answering that question in Azure and Microsoft Entra ID, and about using AI to help without letting it decide what's true.

## The idea in one sentence

AI is useful in Azure security when it **explains evidence**, and dangerous when it **replaces evidence**.

Everything else follows from that. You collect evidence with read-only access, and you record what you couldn't collect. You compute paths from it in code, where the reasoning is repeatable. You label every claim by how it's known. A model explains the result from a small, cited selection of that evidence, a validator checks what the model wrote, and a person decides. After a change, the next snapshot says whether it worked.

```text
evidence  →  paths (code)  →  evidence pack  →  model draft  →  validator  →  human
    ↑                                                                          │
    └───────────────────────  next snapshot verifies the change  ←─────────────┘
```

None of the steps is new on its own. What the book adds is the discipline of keeping them separate, so that a model's fluency never gets promoted to a fact, and a missing piece of evidence never gets reported as a clean result.

## Who this book is for

The book is written for **Azure security architects and cloud platform engineers** with two or more years of hands-on Azure experience. You should be comfortable with resource groups, role assignments, app registrations, and virtual networks, and able to read PowerShell, Python, KQL, and Terraform. You don't need to be a data scientist or to have built anything with a language model before.

It's also written for **security leaders who have to judge AI security tooling**: whether to buy it, build it, or trust what it says. You can skip most of the code. The chapters on evidence (2), on where models help and hurt (7 and 8), and on verification and governance (10 and 11) give you the questions to ask, and the answers to expect from a tool that's doing it properly.

## What you'll be able to do

By the end, you should be able to:

1. Collect Azure and Entra ID evidence with a dedicated, read-only, secretless identity, and treat what you couldn't read as a result rather than an omission.
2. Reason about **paths** — sequences of identity, network, and data hops from an entry point to something that matters — instead of independent checklist items.
3. Label every claim by how it's known: observed fact, derived fact, deterministic inference, AI inference, or human assertion. Use the words that go with each.
4. Use language models to explain, translate for an audience, summarize, and draft, with citations a machine can check, while keeping ranking, decisions, and changes with people and code.
5. Recommend the fewest changes that close the most paths, hand them off as advisory changes, and verify them against the next snapshot instead of trusting "fixed".
6. Govern the AI tooling itself, which ends up holding a map of your weaknesses.

## How to read it

Chapter 1 explains how the four parts fit together. Three reading paths work well:

- **Front to back.** The chapters build on each other, and one fictional estate, Contoso's payments platform, runs through all of them. Its evidence is collected in Chapter 3, its six paths are derived in Chapter 4, and they're explained by a model in Chapter 7, attacked through its own metadata in Chapter 8, cut in Chapter 9, and verified in Chapter 10. This is the path for engineers who will build something.
- **The evaluator's path.** Chapters 1, 2, 7, 8, 10, and 11, plus the table of patterns that look useful and aren't in Appendix C. This is the path for leaders assessing a product or an internal proposal.
- **If you already do attack-path work.** Start with Chapter 2, then read Part III (Chapters 7 and 8) and Part IV (Chapters 9 to 11). Dip into Chapters 4 to 6 where the Azure details are new to you.

Every chapter ends with a summary, key terms, and a lab. The [glossary](../back-matter/glossary.md) collects the key terms in one place.

## The companion lab

Every technique in the book runs against a small companion lab: an Azure estate defined in Terraform, with Contoso's six paths, Chapter 5's network mistakes, and enough ordinary hygiene noise to make Chapter 1's point. Appendix A describes what it builds, what it costs, how each chapter changes it, and how to tear it down. Appendix B collects the queries, and Appendix C the prompts.

**The lab is deliberately vulnerable.** It creates users who can take over an application, an identity that can read customer data stores, and storage open to the internet. Deploy it only into a tenant and subscription you use for nothing else, put no real data in it, and destroy it when you finish a session. Chapter 8's lab plants instructions in resource tags. Do that only in the lab, never in resources that other people's tooling reads.

The labs in Chapters 7, 8, and 11 need a language model deployment. Any deployment that supports structured output will do. Use the lab's synthetic data unless your organization has explicitly approved sending real evidence to that deployment.

## Conventions

- **Contoso is fictional.** So are its people, incidents, and numbers. Where a figure illustrates a point, the text says it's illustrative. Where something comes from my own experience rather than a source, the text says that too.
- **Evidence labels.** Claims in examples carry the evidence category from Chapter 2. Model output in examples is labeled as model output, and AI inferences are marked "(AI-inferred)", the same way the book asks you to label them.
- **Path and hop labels.** Chapter 2 numbers the hops of the single opening path 1 to 8. From Chapter 7 onward, the whole payments graph uses the IDs in Chapter 7's evidence pack: hops H1–H9, paths P1–P6, gaps G1–G2, and cut point C1. The appendices use those IDs too.
- **Dated notes.** Azure, Entra ID, and model services change constantly. Behavior that might have changed by the time you read this sits in a note that starts **As of 2026-10**. Check those against current Microsoft documentation before you rely on them.
- **Code.** Examples are complete enough to run against the lab, and short enough to read. They're teaching code. They handle the traps the text discusses, such as paging, gaps, and absent properties, but they aren't hardened products. Collection code is read-only. The only code that changes anything is the lab's Terraform, which you apply yourself.
- **Names in the lab.** Storage account and app names must be unique across Azure, so the lab adds a short suffix. Appendix A's `book_names` output maps each book name to yours.

## What this book isn't

It isn't a catalog of Azure security controls or a walkthrough of a benchmark. Those exist, and Chapter 1 explains why they're necessary and not sufficient.

It isn't an offensive security guide. Paths here are computed from configuration, by defenders, with read-only access. Nothing in the book exploits anything.

It isn't about a product. Every technique uses public Azure and Microsoft Graph APIs and code you can read. I build commercial tooling in this area, and that experience shaped the problems the book chooses. None of the chapters or Appendices A to C depend on that tooling, describe its internals, or recommend it. If the optional case study in Appendix D is published, the tooling it used appears only in a clearly marked sidebar.

And it doesn't promise that models will get this right. The book's position is that they'll keep getting some of it wrong, and that the useful question is how to make those failures visible before a person relies on them.

---

## Author notes (remove before submission)

- Confirm the disclosure paragraph in "What this book isn't": whether to name the tooling, and whether the publisher has a standard disclosure format.
- Add acknowledgments (technical reviewers, anyone who walked the lab) once the review round has happened.
- The reading paths name chapters by number. Re-check them if chapters are reordered.
- Keep "What you'll be able to do" in step with the README thesis and the chapter summaries.
- When the lab moves to its own public repository, replace the in-repo paths with that repository's URL.
