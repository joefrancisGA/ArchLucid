import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_QUOTE_PACKET_METER_TABLE_FOOTNOTE } from "@/lib/product-line/securenow-quote-packet-meter-table-footnote-copy";
import { cn } from "@/lib/utils";

export function SecureNowQuotePacketMeterTableFootnote(): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="securenow-quote-packet-meter-table-footnote"
    >
      {SECURENOW_QUOTE_PACKET_METER_TABLE_FOOTNOTE}
    </p>
  );
}
