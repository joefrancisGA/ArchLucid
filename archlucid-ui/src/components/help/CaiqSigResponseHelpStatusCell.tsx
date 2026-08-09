import { StatusTag } from "@/components/StatusTag";
import {
  mapCaiqSigStatusLabelToTagKind,
  resolveCaiqSigStatusTagLabel,
} from "@/lib/caiq-sig-response-help-presentation";

type CaiqSigResponseHelpStatusCellProps = {
  readonly statusLabel: string;
};

export function CaiqSigResponseHelpStatusCell(props: CaiqSigResponseHelpStatusCellProps): React.JSX.Element {
  const label = resolveCaiqSigStatusTagLabel(props.statusLabel);
  const kind = mapCaiqSigStatusLabelToTagKind(props.statusLabel);

  return <StatusTag kind={kind} label={label} />;
}
