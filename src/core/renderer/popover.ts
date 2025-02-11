import type { MiddlewareData, Placement } from '@floating-ui/dom';
import type { MaybeRef } from '@vue/reactivity';
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { unref } from '@vue/reactivity';

export type PopoverArrowPositionedHandler = (arrowEl: HTMLElement, placement: Placement, arrowData: NonNullable<MiddlewareData['arrow']>) => void;

function updatePosition(
  referenceEl: MaybeRef<HTMLElement>,
  popoverEl: MaybeRef<HTMLElement>,
  options?: Partial<{
    placement?: Placement
    arrowElRef?: MaybeRef<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    popoverPadding?: number
    popoverOffset?: number
  }>,
): void {
  const {
    placement,
    arrowElRef,
    popoverArrowPositioned,
    popoverPadding = 4,
    popoverOffset = 8,
  } = options ?? {};

  computePosition(
    unref(referenceEl),
    unref(popoverEl),
    {
      placement,
      middleware: [
        flip(),
        shift({ padding: popoverPadding }),
        offset(popoverOffset),
        ...(
          unref(arrowElRef)
            ? [arrow({ element: unref(arrowElRef)! })]
            : []
        ),
      ],
    },
  ).then(({ x, y, placement, middlewareData }) => {
    Object.assign(unref(popoverEl).style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    if (middlewareData.arrow && unref(arrowElRef)) {
      popoverArrowPositioned?.(unref(arrowElRef)!, placement, middlewareData.arrow);
    }
  });
}

export function showPopover(
  referenceEl: MaybeRef<HTMLElement>,
  createPopoverEl: () => MaybeRef<HTMLElement>,
  options?: Partial<{
    arrowElRef?: MaybeRef<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    popoverPadding?: number
    popoverOffset?: number
    placement: Placement
    zIndex: number
  }>,
): [HTMLElement, () => void] {
  const {
    arrowElRef,
    popoverArrowPositioned,
    popoverPadding,
    popoverOffset,
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
    () => updatePosition(referenceEl, popoverEl, {
      arrowElRef,
      placement,
      popoverArrowPositioned,
      popoverPadding,
      popoverOffset,
    }),
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
