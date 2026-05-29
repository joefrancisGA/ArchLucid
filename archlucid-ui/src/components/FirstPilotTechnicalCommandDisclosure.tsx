import { FIRST_PILOT_TECHNICAL_COMMAND_DISCLOSURE_SUMMARY } from "@/lib/first-pilot-diagnostics-copy";

/** Collapses repo CLI/script commands — operator home surfaces link to diagnostics instead. */
export function FirstPilotTechnicalCommandDisclosure(props: { readonly commands: readonly string[] }) {
  if (props.commands.length === 0) {
    return null;
  }

  return (
    <details className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
      <summary className="cursor-pointer font-medium text-neutral-700 dark:text-neutral-300">
        {FIRST_PILOT_TECHNICAL_COMMAND_DISCLOSURE_SUMMARY}
      </summary>
      <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
        {props.commands.map((command) => (
          <li key={command}>
            <code className="font-mono text-[11px]">{command}</code>
          </li>
        ))}
      </ul>
    </details>
  );
}
