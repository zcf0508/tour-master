import type { MiddlewareData, Placement, ReferenceElement } from '@floating-ui/dom';
import type { MaybeRef, Ref } from '@vue/reactivity';
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { unref } from '@vue/reactivity';

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
  referenceEl: MaybeRef<ReferenceElement | undefined>,
  popoverEl: MaybeRef<HTMLElement>,
  options?: Partial<{
    placement?: Placement
    arrowElRef?: Ref<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    popoverPadding?: number
    popoverOffset?: number
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

  const unrefedReferenceEl = unref(referenceEl);
  const unrefedPopoverEl = unref(popoverEl);

  if (!unrefedReferenceEl) {
    centerPopover(unrefedPopoverEl);
    if (unref(arrowElRef)) {
      Object.assign(unref(arrowElRef)!.style, {
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
          unref(arrowElRef)
            ? [
              arrow({
                element: unref(arrowElRef)!,
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

    if (middlewareData.arrow && unref(arrowElRef)) {
      Object.assign(unref(arrowElRef)!.style, {
        display: '',
      });
      popoverArrowPositioned?.(unref(arrowElRef)!, placement, middlewareData.arrow);
    }
  });
}

export function showPopover(
  referenceEl: MaybeRef<ReferenceElement | undefined>,
  createPopoverEl: () => MaybeRef<HTMLElement>,
  options?: Partial<{
    arrowElRef?: Ref<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    popoverPadding?: number
    popoverOffset?: number
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

  Object.assign(unref(popoverEl).style, {
    zIndex: options?.zIndex !== undefined
      ? String(options.zIndex)
      : undefined,
  });

  const unrefedReferenceEl = unref(referenceEl);
  let cleanup: () => void;

  if (unrefedReferenceEl) {
    cleanup = autoUpdate(
      unrefedReferenceEl,
      unref(popoverEl),
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
    updatePosition(undefined, popoverEl, {
      arrowElRef,
    });
    cleanup = () => {};
  }

  function destory(): void {
    cleanup();
    unref(popoverEl).remove();
    if (arrowElRef) {
      arrowElRef.value = undefined;
    }
  }

  return [
    unref(popoverEl),
    destory,
  ];
}
