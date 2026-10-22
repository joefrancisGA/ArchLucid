import { CommandGroup, CommandItem } from "@/components/ui/command";
import { resetBuyerCtoDemoSession } from "@/lib/buyer/buyer-cto-demo-orchestration";
import {
  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
} from "@/lib/buyer/buyer-cto-demo-tour";
import {
  COMMAND_PALETTE_RESET_DEMO_LABEL,
  COMMAND_PALETTE_START_CTO_DEMO_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";

export function CommandPaletteDemoActions({
  onNavigate,
  onClose,
}: {
  onNavigate: (href: string) => void;
  onClose: () => void;
}) {
  if (!isCtoDemoPackEnv()) {
    return null;
  }

  return (
    <CommandGroup heading="CTO demo">
      <CommandItem
        value={`demo ${COMMAND_PALETTE_START_CTO_DEMO_LABEL} tour start`}
        onSelect={() => {
          onClose();
          window.dispatchEvent(new Event(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT));
        }}
      >
        {COMMAND_PALETTE_START_CTO_DEMO_LABEL}
      </CommandItem>
      <CommandItem
        value={`demo ${COMMAND_PALETTE_RESET_DEMO_LABEL} reset showcase`}
        onSelect={() => {
          onClose();
          void resetBuyerCtoDemoSession().then((result) => {
            onNavigate(result.destinationHref);
          });
        }}
      >
        {COMMAND_PALETTE_RESET_DEMO_LABEL}
      </CommandItem>
    </CommandGroup>
  );
}
