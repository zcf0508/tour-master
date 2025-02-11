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
  popoverEl: MaybeRef<HTMLElement>,
  placement?: Placement,
): void {
  computePosition(
    unref(referenceEl),
    unref(popoverEl),
    {
      placement,
      middleware: [
        flip(),
        shift({ padding: 4 }),
        offset(8),
      ],
    },
  ).then(({ x, y }) => {
    Object.assign(unref(popoverEl).style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });
}

export function showPopover(
  referenceEl: MaybeRef<HTMLElement>,
  createPopoverEl: () => MaybeRef<HTMLElement>,
  options?: Partial<{
    placement: Placement
    zIndex: number
  }>,
): [HTMLElement, () => void] {
  const {
    placement = 'bottom',
  } = options || {};

  const popoverEl = createPopoverEl();

  Object.assign(unref(popoverEl).style, {
    zIndex: options?.zIndex !== undefined
      ? String(options.zIndex)
      : undefined,
  });

  const cleanup = autoUpdate(
    unref(referenceEl),
    unref(popoverEl),
    () => updatePosition(referenceEl, popoverEl, placement),
  );

  function destory(): void {
    cleanup();
    unref(popoverEl).remove();
  }

  return [
    unref(popoverEl),
    destory,
  ];
}
