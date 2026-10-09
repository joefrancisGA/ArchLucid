> **Scope:** Chapter 8 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 8 — Where LLMs hurt

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

The failure modes are predictable: invented findings, fake precision, injected instructions, and automation that outruns review.

## Key points

- Hallucinated resources, roles, or CVEs.
- Numeric confidence with no calibration behind it.
- Prompt injection through resource tags, descriptions, and app display names that the model reads as data.
- Letting the model apply changes (ARM writes, `terraform apply`) without a human gate.
- Evaluation: golden test sets and metamorphic tests (same evidence, reordered → same answer).

## Lab idea

Plant an instruction in a resource tag and show a naive pipeline obeying it; then show the mitigation.

## Open questions

- Responsible disclosure framing for the injection demo.
