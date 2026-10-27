import { formatPolicySection, pushPolicyAtCommitMarkdownLines } from "./export-markdown-policy-section";
import { formatFeasibilityVerdictMarkdownSection } from "@/lib/feasibility/format-feasibility-verdict-markdown-section";
import { formatTransparencyTrailMarkdownSection } from "@/lib/feasibility/export-transparency-trail-section";
import { isRecord, normalizeInlineText, pushBulletLines } from "./export-markdown-text";

function formatRequirementItems(items: unknown, heading: string, lines: string[], listNotStoredCopy: string): void {
  if (items === null || items === undefined) {
    lines.push(`### ${heading}`);
    lines.push("");
    lines.push(listNotStoredCopy);
    lines.push("");

    return;
  }

  if (!Array.isArray(items)) {
    return;
  }

  if (items.length === 0) {
    lines.push(`### ${heading}`);
    lines.push("");
    lines.push(
      heading === "Covered requirements"
        ? "Covered requirements were stored as an empty list."
        : "Uncovered requirements were stored as an empty list.",
    );
    lines.push("");

    return;
  }

  lines.push(`### ${heading}`);
  lines.push("");

  for (const raw of items) {
    if (!isRecord(raw)) {
      continue;
    }

    const name = normalizeInlineText(raw.requirementName);
    const text = normalizeInlineText(raw.requirementText);
    const status = normalizeInlineText(raw.coverageStatus);

    if (name) {
      lines.push(`- **${name}**`);
    } else if (raw.requirementName === null || raw.requirementName === undefined) {
      lines.push("- Requirement name was not stored.");
    }

    if (status) {
      lines.push(`  - Coverage: ${status}`);
    } else if (raw.coverageStatus === null || raw.coverageStatus === undefined) {
      lines.push("  - Coverage status was not stored.");
    }

    if (text) {
      lines.push(`  - ${text}`);
    } else if (raw.requirementText === null || raw.requirementText === undefined) {
      lines.push("  - Requirement text was not stored.");
    }
  }

  lines.push("");
}

export function formatManifestDocumentShape(m: Record<string, unknown>): string {
  const lines: string[] = [];
  const meta = isRecord(m.metadata) ? m.metadata : null;
  const topology = isRecord(m.topology) ? m.topology : null;
  const security = isRecord(m.security) ? m.security : null;
  const requirements = isRecord(m.requirements) ? m.requirements : null;
  const constraints = isRecord(m.constraints) ? m.constraints : null;
  const cost = isRecord(m.cost) ? m.cost : null;
  const compliance = isRecord(m.compliance) ? m.compliance : null;
  const policy = isRecord(m.policy) ? m.policy : null;

  const manifestId = normalizeInlineText(m.manifestId);
  const runId = normalizeInlineText(m.runId);
  const ruleSetId = normalizeInlineText(m.ruleSetId);
  const ruleSetVersion = normalizeInlineText(m.ruleSetVersion);
  const manifestHash = normalizeInlineText(m.manifestHash);
  const changeDescription = meta && typeof meta.changeDescription === "string" ? meta.changeDescription : null;
  const manifestVersion = meta ? normalizeInlineText(meta.manifestVersion) : null;

  const titleBase = changeDescription ?? "Change description was not stored.";

  lines.push(`# ${titleBase}`);
  lines.push("");

  lines.push("## Document metadata");
  lines.push("");

  if (manifestId) {
    lines.push(`- **Review record id:** \`${manifestId}\``);
  } else if (m.manifestId === null || m.manifestId === undefined) {
    lines.push("Review record id was not stored.");
  }

  if (runId) {
    lines.push(`- **Review id:** \`${runId}\``);
  } else if (m.runId === null || m.runId === undefined) {
    lines.push("Review id was not stored.");
  }

  if (ruleSetId && ruleSetVersion) {
    lines.push(`- **Policy pack:** ${ruleSetId} @ ${ruleSetVersion}`);
  } else if (ruleSetId) {
    lines.push(
      `- **Policy pack:** ${ruleSetId}${m.ruleSetVersion === null || m.ruleSetVersion === undefined
        ? " · Policy pack version was not stored."
        : ""}`,
    );
  } else if (m.ruleSetId === null || m.ruleSetId === undefined) {
    if (m.ruleSetVersion === null || m.ruleSetVersion === undefined) {
      lines.push("Policy pack was not stored.");
    }
  }

  if (manifestHash) {
    lines.push(`- **Review record hash:** \`${manifestHash}\``);
  } else if (m.manifestHash === null || m.manifestHash === undefined) {
    lines.push("Review record hash was not stored.");
  }

  if (manifestVersion) {
    lines.push(`- **Review record version:** ${manifestVersion}`);
  } else if (meta === null || meta.manifestVersion === null || meta.manifestVersion === undefined) {
    lines.push("Review record version was not stored.");
  }

  pushPolicyAtCommitMarkdownLines(m, lines);

  lines.push("## Objectives");
  lines.push("");

  if (changeDescription) {
    lines.push(changeDescription);
    lines.push("");
  }

  if (requirements === null || requirements === undefined) {
    lines.push("Requirements were not stored.");
    lines.push("");
  } else {
    formatRequirementItems(
      requirements.covered,
      "Covered requirements",
      lines,
      "Covered requirements were not stored.",
    );
    formatRequirementItems(
      requirements.uncovered,
      "Uncovered requirements",
      lines,
      "Uncovered requirements were not stored.",
    );
  }

  formatPolicySection(policy, lines);

  if (
    !changeDescription &&
    requirements === null &&
    policy === null
  ) {
    lines.push("_No explicit objectives were present on the review record document._");
    lines.push("");
  }

  lines.push("## Architecture overview");
  lines.push("");

  if (m.assumptions === null || m.assumptions === undefined) {
    lines.push("Assumptions were not stored.");
  } else {
    pushBulletLines(lines, m.assumptions, "_No assumptions listed._");
  }

  lines.push("");

  if (constraints !== null) {
    lines.push("### Constraints");
    lines.push("");
    if (constraints.mandatoryConstraints === null || constraints.mandatoryConstraints === undefined) {
      lines.push("Mandatory constraints were not stored.");
    } else {
      pushBulletLines(lines, constraints.mandatoryConstraints, "_No mandatory constraints._");
    }

    if (constraints.preferences === null || constraints.preferences === undefined) {
      lines.push("Preferences were not stored.");
    } else if (Array.isArray(constraints.preferences) && constraints.preferences.length === 0) {
      lines.push("Preferences were stored as an empty list.");
    } else {
      pushBulletLines(lines, constraints.preferences, undefined);
    }

    lines.push("");
  } else {
    lines.push("Constraints were not stored.");
    lines.push("");
  }

  if (topology !== null) {
    lines.push("### Architecture structure");
    lines.push("");
    if (topology.selectedPatterns === null || topology.selectedPatterns === undefined) {
      lines.push("Selected patterns were not stored.");
    } else {
      pushBulletLines(lines, topology.selectedPatterns, undefined);
    }
    if (topology.resources === null || topology.resources === undefined) {
      lines.push("Resources were not stored.");
    } else {
      pushBulletLines(lines, topology.resources, undefined);
    }
    if (topology.gaps === null || topology.gaps === undefined) {
      lines.push("Topology gaps were not stored.");
    } else {
      pushBulletLines(lines, topology.gaps, undefined);
    }
    lines.push("");
  } else {
    lines.push("Architecture structure was not stored.");
    lines.push("");
  }

  if (cost !== null) {
    lines.push("### Cost");
    lines.push("");
    if (cost.notes === null || cost.notes === undefined) {
      lines.push("Cost notes were not stored.");
    } else if (Array.isArray(cost.notes) && cost.notes.length === 0) {
      lines.push("Cost notes were stored as an empty list.");
    } else {
      pushBulletLines(lines, cost.notes, undefined);
    }

    if (cost.costRisks === null || cost.costRisks === undefined) {
      lines.push("Cost risks were not stored.");
    } else if (Array.isArray(cost.costRisks) && cost.costRisks.length === 0) {
      lines.push("Cost risks were stored as an empty list.");
    } else {
      pushBulletLines(lines, cost.costRisks, undefined);
    }

    if (typeof cost.maxMonthlyCost === "number") {
      lines.push(`- **Max monthly cost (estimate):** ${cost.maxMonthlyCost}`);
    } else if (cost.maxMonthlyCost === null || cost.maxMonthlyCost === undefined) {
      lines.push("Max monthly cost was not stored.");
    }

    lines.push("");
  } else {
    lines.push("Cost was not stored.");
    lines.push("");
  }

  if (compliance !== null) {
    lines.push("### Compliance");
    lines.push("");
    const controls = compliance.controls;

    if (Array.isArray(controls)) {
      for (const c of controls) {
        if (!isRecord(c)) {
          continue;
        }

        const name = normalizeInlineText(c.controlName);
        const status = normalizeInlineText(c.status);

        if (name && status) {
          lines.push(`- **${name}:** ${status}`);
        } else if (name) {
          lines.push(
            `- ${name}${c.status === null || c.status === undefined ? ": Control status was not stored." : ""}`,
          );
        } else if (c.controlName === null || c.controlName === undefined) {
          lines.push("- Control name was not stored.");
        } else if (c.controlName === "") {
          lines.push("- Control name was stored empty.");
        }
      }
    }

    pushBulletLines(lines, compliance.gaps, undefined);
    lines.push("");
  } else {
    lines.push("Compliance was not stored.");
    lines.push("");
  }

  lines.push("## Component breakdown");
  lines.push("");

  const decisions = Array.isArray(m.decisions) ? m.decisions : [];
  const servicesValue = topology?.services;
  const datastoresValue = topology?.datastores;
  const relationshipsValue = topology?.relationships;
  const decisionsValue = m.decisions;
  const services = Array.isArray(servicesValue) ? servicesValue : [];
  const datastores = Array.isArray(datastoresValue) ? datastoresValue : [];
  const relationships = Array.isArray(relationshipsValue) ? relationshipsValue : [];

  if (services.length > 0) {
    lines.push("### Services");
    lines.push("");

    for (const s of services) {
      if (!isRecord(s)) {
        continue;
      }

      const name = normalizeInlineText(s.serviceName);
      const sid = normalizeInlineText(s.serviceId);
      const purpose = normalizeInlineText(s.purpose);

      if (s.serviceName === null || s.serviceName === undefined) {
        lines.push("- Service name was not stored.");

        if (sid) {
          lines.push(`  - **Service id:** \`${sid}\``);
        }
      } else if (typeof s.serviceName === "string" && s.serviceName.length === 0) {
        lines.push("- Service name was stored empty.");
      } else {
        lines.push(`- **${name}**${sid ? ` (\`${sid}\`)` : ""}`);
      }

      if (s.serviceId === null || s.serviceId === undefined) {
        lines.push("  - Service id was not stored.");
      }

      if (purpose) {
        lines.push(`  - ${purpose}`);
      } else if (s.purpose === null || s.purpose === undefined) {
        lines.push("  - Purpose was not stored.");
      } else if (typeof s.purpose === "string" && s.purpose.length === 0) {
        lines.push("  - Purpose was stored empty.");
      }
    }

    lines.push("");
  }

  if (datastores.length > 0) {
    lines.push("### Datastores");
    lines.push("");

    for (const ds of datastores) {
      if (!isRecord(ds)) {
        continue;
      }

      const name = normalizeInlineText(ds.name);
      const did = normalizeInlineText(ds.datastoreId);

      if (ds.name === null || ds.name === undefined) {
        lines.push("- Datastore name was not stored.");

        if (did) {
          lines.push(`  - **Datastore id:** \`${did}\``);
        }
      } else if (typeof ds.name === "string" && ds.name.length === 0) {
        lines.push("- Datastore name was stored empty.");
      } else {
        lines.push(`- **${name}**${did ? ` (\`${did}\`)` : ""}`);
      }

      if (ds.datastoreId === null || ds.datastoreId === undefined) {
        lines.push("  - Datastore id was not stored.");
      }
    }

    lines.push("");
  }

  if (relationships.length > 0) {
    lines.push("### Relationships");
    lines.push("");

    for (const r of relationships) {
      if (!isRecord(r)) {
        continue;
      }

      const desc = normalizeInlineText(r.description);
      const relId = normalizeInlineText(r.relationshipId);
      const missingRelId = r.relationshipId === null || r.relationshipId === undefined;
      const src = normalizeInlineText(r.sourceId);
      const tgt = normalizeInlineText(r.targetId);

      if (r.description === "" && r.sourceId === "" && r.targetId === "") {
        lines.push(
          `- Relationship description was stored empty.${relId ? ` (\`${relId}\`)` : ""}${missingRelId ? " Relationship id was not stored." : ""}`,
        );

        continue;
      }

      const parts = [
        src ?? (r.sourceId === null || r.sourceId === undefined ? "Source was not stored" : null),
        tgt ?? (r.targetId === null || r.targetId === undefined ? "Target was not stored" : null),
      ].filter((part): part is string => part !== null).join(" → ");

      if (
        (r.description === null || r.description === undefined)
        && (r.sourceId === null || r.sourceId === undefined)
        && (r.targetId === null || r.targetId === undefined)
      ) {
        lines.push(`- Relationship description was not stored.${relId ? ` (\`${relId}\`)` : ""}${missingRelId ? " Relationship id was not stored." : ""}`);
      } else if (desc) {
        lines.push(`- ${desc}${relId ? ` (\`${relId}\`)` : ""}${missingRelId ? " Relationship id was not stored." : ""}`);
      } else if (parts) {
        lines.push(`- ${parts}${relId ? ` (\`${relId}\`)` : ""}${missingRelId ? " Relationship id was not stored." : ""}`);
      }
    }

    lines.push("");
  }

  if (decisions.length > 0) {
    lines.push("### Architecture decisions");
    lines.push("");

    for (const d of decisions) {
      if (!isRecord(d)) {
        continue;
      }

      const dTitle = normalizeInlineText(d.title);
      const did = normalizeInlineText(d.decisionId);
      const category = normalizeInlineText(d.category);
      const rationale = normalizeInlineText(d.rationale);
      const option = normalizeInlineText(d.selectedOption);

      if (dTitle) {
        lines.push(`#### ${dTitle}`);
        lines.push("");
      } else if (d.title === null || d.title === undefined) {
        lines.push("#### Decision title was not stored.");
        lines.push("");
      } else if (d.title === "") {
        lines.push("#### Decision title was stored empty.");
        lines.push("");
      } else {
        lines.push("####");
        lines.push("");
      }

      if (d.decisionId === null || d.decisionId === undefined) {
        lines.push("- Decision id was not stored.");
      } else if (d.decisionId === "") {
        lines.push("- Decision id was stored empty.");
      } else if (did) {
        lines.push(`- **Decision id:** \`${did}\``);
      }

      if (category) {
        lines.push(`- **Category:** ${category}`);
      } else if (d.category === null || d.category === undefined) {
        lines.push("- Decision category was not stored.");
      } else if (d.category === "") {
        lines.push("- Decision category was stored empty.");
      }

      if (d.selectedOption === null || d.selectedOption === undefined) {
        lines.push("- Selected option was not stored.");
      } else if (d.selectedOption === "") {
        lines.push("- Selected option was stored empty.");
      } else if (option) {
        lines.push(`- **Selected option:** ${option}`);
      }

      if (rationale) {
        lines.push("");
        lines.push(rationale);
      } else if (d.rationale === null || d.rationale === undefined) {
        lines.push("- Decision rationale was not stored.");
      }

      lines.push("");
    }
  }

  if (
    Array.isArray(servicesValue) &&
    Array.isArray(datastoresValue) &&
    Array.isArray(relationshipsValue) &&
    Array.isArray(decisionsValue) &&
    services.length === 0 &&
    datastores.length === 0 &&
    relationships.length === 0 &&
    decisions.length === 0
  ) {
    lines.push("Services, datastores, relationships, and decisions were stored as empty lists.");
    lines.push("");
  } else {
    if (!Array.isArray(servicesValue)) {
      lines.push("Services were not stored.");
    }

    if (!Array.isArray(datastoresValue)) {
      lines.push("Datastores were not stored.");
    }

    if (!Array.isArray(relationshipsValue)) {
      lines.push("Relationships were not stored.");
    }

    if (!Array.isArray(decisionsValue)) {
      lines.push("Decisions were not stored.");
    }

    lines.push("");
  }

  lines.push("## Security model");
  lines.push("");

  if (security !== null) {
    if (security.controls === null || security.controls === undefined) {
      lines.push("Security controls were not stored.");
      lines.push("");
    }

    const controls = Array.isArray(security.controls) ? security.controls : [];

    if (controls.length === 0 && Array.isArray(security.controls)) {
      lines.push("Security controls were stored as an empty list.");
      lines.push("");
    }

    if (controls.length > 0) {
      lines.push("### Controls");
      lines.push("");

      for (const c of controls) {
        if (!isRecord(c)) {
          continue;
        }

        const cname = normalizeInlineText(c.controlName);
        const status = normalizeInlineText(c.status);
        const impact = normalizeInlineText(c.impact);

        if (cname) {
          lines.push(
            `- **${cname}**${
              status
                ? ` — ${status}`
                : c.status === null || c.status === undefined
                  ? " — Control status was not stored."
                  : c.status === ""
                    ? " — Control status was stored empty."
                    : ""
            }${
              impact
                ? ` (${impact})`
                : c.impact === null || c.impact === undefined
                  ? " (Impact was not stored.)"
                  : c.impact === ""
                    ? " (Impact was stored empty.)"
                    : ""
            }`,
          );
        } else if (c.controlName === null || c.controlName === undefined) {
          lines.push("- Control name was not stored.");
        } else if (c.controlName === "") {
          lines.push("- Control name was stored empty.");
        }
      }

      lines.push("");
    }

    if (security.gaps === null || security.gaps === undefined) {
      lines.push("Security gaps were not stored.");
    } else if (Array.isArray(security.gaps) && security.gaps.length === 0) {
      lines.push("Security gaps were stored as an empty list.");
    } else {
      pushBulletLines(lines, security.gaps, undefined);
    }
  } else {
    lines.push("Security model was not stored.");
  }

  if (m.warnings === null || m.warnings === undefined) {
    lines.push("Warnings were not stored.");
  } else if (Array.isArray(m.warnings) && m.warnings.length === 0) {
    lines.push("Warnings were stored as an empty list.");
  } else {
    pushBulletLines(lines, m.warnings, undefined);
  }

  const feasibilityVerdict = isRecord(m.feasibilityVerdict) ? m.feasibilityVerdict : null;
  const feasibilityVerdictMarkdown = formatFeasibilityVerdictMarkdownSection(
    feasibilityVerdict as Parameters<typeof formatFeasibilityVerdictMarkdownSection>[0],
  );

  if (feasibilityVerdictMarkdown.trim().length > 0) {
    lines.push(feasibilityVerdictMarkdown.trim());
    lines.push("");
  }

  const transparencyTrail =
    feasibilityVerdict !== null && isRecord(feasibilityVerdict.transparencyTrail)
      ? (feasibilityVerdict.transparencyTrail as {
          asserted?: unknown;
          inferred?: unknown;
          skipped?: unknown;
        })
      : null;

  if (feasibilityVerdict !== null && (feasibilityVerdict.transparencyTrail === null || feasibilityVerdict.transparencyTrail === undefined)) {
    lines.push("Transparency trail was not stored.");
    lines.push("");
  } else if (
    transparencyTrail !== null &&
    Array.isArray(transparencyTrail.asserted) &&
    Array.isArray(transparencyTrail.inferred) &&
    Array.isArray(transparencyTrail.skipped)
  ) {
    lines.push(formatTransparencyTrailMarkdownSection({
      asserted: transparencyTrail.asserted as never,
      inferred: transparencyTrail.inferred as never,
      skipped: transparencyTrail.skipped as never,
    }));
  }

  return lines.join("\n").trimEnd() + "\n";
}
