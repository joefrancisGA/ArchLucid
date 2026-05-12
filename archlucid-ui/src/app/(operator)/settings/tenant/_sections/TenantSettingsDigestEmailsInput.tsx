import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";

type Props = {
  id: string;
  value: readonly string[];
  onChange: (next: string[]) => void;
  readOnly: boolean;
};

/** Single-line input that accepts comma- or newline-separated emails (same UX as prior inline helper). */
export function TenantSettingsDigestEmailsInput(props: Props): ReactNode {
  const v = props.value.join(", ");

  return (
    <Input
      id={props.id}
      value={v}
      onChange={(ev) => {
        const raw = ev.target.value;
        const next = raw
          .split(/[,\n]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        props.onChange(next);
      }}
      readOnly={props.readOnly}
    />
  );
}
