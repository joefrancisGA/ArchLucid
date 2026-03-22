"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assignPolicyPack,
  createPolicyPack,
  getEffectivePolicyContent,
  getEffectivePolicyPacks,
  listPolicyPackVersions,
  listPolicyPacks,
  publishPolicyPackVersion,
} from "@/lib/api";
import type { EffectivePolicyPackSet, PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";

const PACK_TYPES = [
  { value: "BuiltIn", label: "Built-in template" },
  { value: "TenantCustom", label: "Tenant custom" },
  { value: "WorkspaceCustom", label: "Workspace custom" },
  { value: "ProjectCustom", label: "Project custom" },
];

const DEFAULT_CONTENT = `{
  "complianceRuleIds": [],
  "alertRuleIds": [],
  "compositeAlertRuleIds": [],
  "advisoryDefaults": {},
  "metadata": {}
}`;

export default function PolicyPacksPage() {
  const [packs, setPacks] = useState<PolicyPack[]>([]);
  const [effective, setEffective] = useState<EffectivePolicyPackSet | null>(null);
  const [effectiveContent, setEffectiveContent] = useState<PolicyPackContentDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("Baseline governance");
  const [description, setDescription] = useState("");
  const [packType, setPackType] = useState("ProjectCustom");
  const [createJson, setCreateJson] = useState(DEFAULT_CONTENT);

  const [selectedPackId, setSelectedPackId] = useState("");
  const [publishVersion, setPublishVersion] = useState("1.0.0");
  const [publishJson, setPublishJson] = useState(DEFAULT_CONTENT);

  const [assignVersion, setAssignVersion] = useState("1.0.0");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, eff, doc] = await Promise.all([
        listPolicyPacks(),
        getEffectivePolicyPacks(),
        getEffectivePolicyContent(),
      ]);
      setPacks(p);
      setEffective(eff);
      setEffectiveContent(doc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0]!.policyPackId);
    }
  }, [packs, selectedPackId]);

  useEffect(() => {
    if (!selectedPackId) return;
    void (async () => {
      try {
        const versions = await listPolicyPackVersions(selectedPackId);
        const latest = versions[0];
        if (latest) {
          setPublishVersion(latest.version);
          setPublishJson(latest.contentJson || DEFAULT_CONTENT);
          setAssignVersion(latest.version);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [selectedPackId]);

  async function onCreate() {
    setError(null);
    try {
      JSON.parse(createJson);
    } catch {
      setError("Create: JSON content is invalid.");
      return;
    }
    setLoading(true);
    try {
      await createPolicyPack({
        name: name.trim() || "Pack",
        description: description.trim(),
        packType,
        initialContentJson: createJson,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  async function onPublish() {
    if (!selectedPackId) {
      setError("Select a pack to publish.");
      return;
    }
    setError(null);
    try {
      JSON.parse(publishJson);
    } catch {
      setError("Publish: JSON content is invalid.");
      return;
    }
    setLoading(true);
    try {
      await publishPolicyPackVersion(selectedPackId, {
        version: publishVersion.trim(),
        contentJson: publishJson,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  async function onAssign() {
    if (!selectedPackId) {
      setError("Select a pack to assign.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await assignPolicyPack(selectedPackId, { version: assignVersion.trim() });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 960 }}>
      <h2 style={{ marginTop: 0 }}>Policy packs</h2>
      <p style={{ color: "#444", fontSize: 14 }}>
        Versioned governance bundles (compliance / alert / composite rule IDs + advisory defaults). Assign packs to the
        current scope; alert evaluators use merged <code>alertRuleIds</code> / <code>compositeAlertRuleIds</code> when
        non-empty.
      </p>

      <p>
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </p>

      {error ? (
        <p style={{ color: "crimson" }} role="alert">
          {error}
        </p>
      ) : null}

      <section style={{ marginBottom: 32 }}>
        <h3>Packs in scope</h3>
        {packs.length === 0 ? (
          <p style={{ color: "#666" }}>No packs yet.</p>
        ) : (
          <ul>
            {packs.map((p) => (
              <li key={p.policyPackId}>
                <strong>{p.name}</strong> — {p.packType} / {p.status} / current{" "}
                <code>{p.currentVersion}</code>
                <div style={{ fontSize: 13, color: "#555" }}>{p.description}</div>
              </li>
            ))}
          </ul>
        )}

        <label style={{ display: "block", marginTop: 12 }}>
          Selected pack (publish / assign)
          <select
            value={selectedPackId}
            onChange={(e) => setSelectedPackId(e.target.value)}
            style={{ display: "block", width: "100%", maxWidth: 480, padding: 8, marginTop: 4 }}
          >
            <option value="">—</option>
            {packs.map((p) => (
              <option key={p.policyPackId} value={p.policyPackId}>
                {p.name} ({p.policyPackId.slice(0, 8)}…)
              </option>
            ))}
          </select>
        </label>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h3>Create pack</h3>
        <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Pack type
            <select
              value={packType}
              onChange={(e) => setPackType(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            >
              {PACK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Initial content (JSON)
            <textarea
              value={createJson}
              onChange={(e) => setCreateJson(e.target.value)}
              rows={12}
              style={{ display: "block", width: "100%", fontFamily: "monospace", fontSize: 12, marginTop: 4 }}
            />
          </label>
          <button type="button" onClick={() => void onCreate()} disabled={loading}>
            Create pack
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h3>Publish version</h3>
        <p style={{ fontSize: 14, color: "#555" }}>
          Creates a published version row and marks the pack Active. Use a new semantic version when content changes.
        </p>
        <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
          <label>
            Version label
            <input
              value={publishVersion}
              onChange={(e) => setPublishVersion(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Content (JSON)
            <textarea
              value={publishJson}
              onChange={(e) => setPublishJson(e.target.value)}
              rows={12}
              style={{ display: "block", width: "100%", fontFamily: "monospace", fontSize: 12, marginTop: 4 }}
            />
          </label>
          <button type="button" onClick={() => void onPublish()} disabled={loading || !selectedPackId}>
            Publish
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h3>Assign to current scope</h3>
        <p style={{ fontSize: 14, color: "#555" }}>
          Assignment must reference an existing version string for that pack (e.g. the one you published).
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label>
            Version
            <input
              value={assignVersion}
              onChange={(e) => setAssignVersion(e.target.value)}
              style={{ display: "block", padding: 8, marginTop: 4, width: 160 }}
            />
          </label>
          <button type="button" onClick={() => void onAssign()} disabled={loading || !selectedPackId}>
            Assign
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h3>Effective resolved packs</h3>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 12,
            overflow: "auto",
            fontSize: 12,
            maxHeight: 360,
          }}
        >
          {effective ? JSON.stringify(effective, null, 2) : "—"}
        </pre>
      </section>

      <section>
        <h3>Merged effective content</h3>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 12,
            overflow: "auto",
            fontSize: 12,
            maxHeight: 360,
          }}
        >
          {effectiveContent ? JSON.stringify(effectiveContent, null, 2) : "—"}
        </pre>
      </section>
    </main>
  );
}
