import type { MiddlewareData, OffsetOptions, Placement, ReferenceElement } from '@floating-ui/dom';
import type { MaybeSignal, Signal } from '../../utils';
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { unsignal } from '../../utils';

export type PopoverArrowPositionedHandler = (
  arrowEl: HTMLElement,
  placement: Placement,
  arrowData: NonNullable<MiddlewareData['arrow']>
) => void;

function centerPopover(popoverEl: HTMLElement): void {
  const { innerWidth, innerHeight } = window;
  const { width, height } = popoverEl.getBoundingClientRect();

  Object.assign(popoverEl.style, {
    position: 'fixed',
    left: `${(innerWidth - width) / 2}px`,
    top: `${(innerHeight - height) / 2}px`,
  });
}

function updatePosition(
  referenceEl: MaybeSignal<ReferenceElement | undefined>,
  popoverEl: MaybeSignal<HTMLElement>,
  options?: Partial<{
    placement?: Placement
    arrowElRef?: MaybeSignal<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    popoverPadding?: number
    popoverOffset?: OffsetOptions
    arrowPadding?: number
  }>,
): void {
  const {
    placement,
    arrowElRef,
    popoverArrowPositioned,
    popoverPadding = 4,
    popoverOffset = 8,
    arrowPadding,
  } = options ?? {};

  const unrefedReferenceEl = unsignal(referenceEl);
  const unrefedPopoverEl = unsignal(popoverEl);

  if (!unrefedReferenceEl) {
    centerPopover(unrefedPopoverEl!);
    if (unsignal(arrowElRef)) {
      Object.assign(unsignal(arrowElRef)!.style, {
        display: 'none',
      });
    }
    return;
  }

  computePosition(
    unrefedReferenceEl,
    unrefedPopoverEl,
    {
      placement,
      middleware: [
        flip(),
        shift({ padding: popoverPadding }),
        offset(popoverOffset),
        ...(
          unsignal(arrowElRef)
            ? [
              arrow({
                element: unsignal(arrowElRef)!,
                padding: arrowPadding,
              }),
            ]
            : []
        ),
      ],
    },
  ).then(({ x, y, placement, middlewareData }) => {
    Object.assign(unrefedPopoverEl.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
    });

    if (middlewareData.arrow && unsignal(arrowElRef)) {
      Object.assign(unsignal(arrowElRef)!.style, {
        display: '',
      });
      popoverArrowPositioned?.(unsignal(arrowElRef)!, placement, middlewareData.arrow);
    }
  });
}

export function showPopover(
  referenceEl: MaybeSignal<ReferenceElement | undefined>,
  createPopoverEl: () => MaybeSignal<HTMLElement>,
  options?: Partial<{
    arrowElRef?: Signal<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    popoverPadding?: number
    popoverOffset?: OffsetOptions
    placement: Placement
    zIndex: number
    arrowPadding?: number
  }>,
): [HTMLElement, () => void] {
  const {
    arrowElRef,
    popoverArrowPositioned,
    popoverPadding,
    popoverOffset,
    placement = 'bottom',
    arrowPadding,
  } = options || {};

  const popoverEl = createPopoverEl();

  Object.assign(unsignal(popoverEl).style, {
    zIndex: options?.zIndex !== undefined
      ? String(options.zIndex)
      : undefined,
  });

  const unrefedReferenceEl = unsignal(referenceEl);
  let cleanup: () => void;

  if (unrefedReferenceEl) {
    cleanup = autoUpdate(
      unrefedReferenceEl,
      unsignal(popoverEl),
      () => updatePosition(referenceEl, popoverEl, {
        arrowElRef,
        placement,
        popoverArrowPositioned,
        popoverPadding,
        popoverOffset,
        arrowPadding,
      }),
    );
  }
  else {
    updatePosition(() => undefined, popoverEl, {
      arrowElRef,
    });
    cleanup = () => {};
  }

  function destory(): void {
    cleanup();
    unsignal(popoverEl).remove();
    if (arrowElRef) {
      arrowElRef(undefined);
    }
  }

  return [
    unsignal(popoverEl),
    destory,
  ];
}
