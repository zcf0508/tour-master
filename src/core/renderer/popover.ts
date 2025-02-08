import type { Placement } from '@floating-ui/dom';
import type { MaybeRef } from '@vue/reactivity';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { unref } from '@vue/reactivity';

function updatePosition(
  referenceEl: MaybeRef<HTMLElement>,
  tooltipEl: MaybeRef<HTMLElement>,
  placement?: Placement,
): void {
  computePosition(
    unref(referenceEl),
    unref(tooltipEl),
    {
      placement,
      middleware: [
        flip(),
        shift({ padding: 4 }),
        offset(8),
      ],
    },
  ).then(({ x, y }) => {
    Object.assign(unref(tooltipEl).style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });
}

export function showPopover(
  referenceEl: MaybeRef<HTMLElement>,
  createTooltipEl: () => MaybeRef<HTMLElement>,
  options?: Partial<{
    placement?: Placement
  }>,
): () => void {
  const {
    placement = 'bottom',
  } = options || {};

  const tooltipEl = createTooltipEl();

  return autoUpdate(
    unref(referenceEl),
    unref(tooltipEl),
    () => updatePosition(referenceEl, tooltipEl, placement),
  );
}
