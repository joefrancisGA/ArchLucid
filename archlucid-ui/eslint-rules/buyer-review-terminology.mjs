/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow legacy run-primary buyer-facing copy; prefer review / review package per GLOSSARY.md (TB-355).",
    },
    schema: [],
    messages: {
      bannedRunCopy:
        'Buyer-facing copy must not use "{{pattern}}". Prefer "review" or "review package".',
    },
  },
  create(context) {
    const bannedPatterns = [
      "run analysis",
      "committed runs",
      "create runs",
      "architecture run",
      "for this run",
      "this run ",
      "run the assessment",
      "new run wizard",
    ];

    const safelistPatterns = [
      /\brunid\b/i,
      /\brun-id\b/i,
      /\/reviews\//i,
      /data-testid/i,
    ];

    function checkString(node, value) {
      if (typeof value !== "string" || value.trim().length === 0) {
        return;
      }

      for (const safelist of safelistPatterns) {
        if (safelist.test(value)) {
          return;
        }
      }

      const lower = value.toLowerCase();

      for (const pattern of bannedPatterns) {
        if (lower.includes(pattern)) {
          context.report({
            node,
            messageId: "bannedRunCopy",
            data: { pattern },
          });
          return;
        }
      }
    }

    return {
      JSXText(node) {
        checkString(node, node.value);
      },
      Literal(node) {
        checkString(node, node.value);
      },
      TemplateElement(node) {
        checkString(node, node.value.raw);
      },
    };
  },
};

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  rules: {
    "no-run-primary-copy": rule,
  },
};

export default plugin;
