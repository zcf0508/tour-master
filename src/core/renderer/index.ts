import type { OffsetOptions, Placement, ReferenceElement } from '@floating-ui/dom';
import type { MaybeSignal, Signal } from '../../utils';
import type { StageDefinition } from './overlay';
import type { PopoverArrowPositionedHandler } from './popover';
import { useGlobalState } from '../../store';
import { toValue } from '../../utils';
import { createOverlaySvg, transitionStage } from './overlay';
import { showPopover } from './popover';

export async function showStep(
  createPopoverEl: () => MaybeSignal<HTMLElement>,
  element?: ReferenceElement | (() => ReferenceElement),
  stages?: StageDefinition[] | (() => StageDefinition[]),
  options?: Partial<{
    arrowElRef?: Signal<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    popoverPadding?: number
    popoverOffset?: OffsetOptions
    overlayPadding?: number
    overlayRadius?: number
    overlayOpacity: number
    placement: Placement
    zIndex: number
    /** default: false */
    hideOverlay?: boolean
    arrowPadding?: number
  }>,
): Promise<[() => void, () => void]> {
  const {
    arrowElRef,
    popoverArrowPositioned,
    popoverOffset,
    popoverPadding,
    overlayOpacity,
    placement = 'bottom',
    zIndex = 10000,
    hideOverlay = false,
    arrowPadding,
  } = options || {};

  const state = useGlobalState();

  // ---

  if (state.popoverContext()) {
    state.popoverContext()![1]();
  }

  const [popoverEl, destoryPopover] = showPopover(
    toValue(element) ?? (toValue(stages)?.length
      ? {
        getBoundingClientRect: () => {
          const stage = toValue(stages)![0];

          return {
            ...stage,
            top: stage.y,
            bottom: stage.y + stage.height,
            left: stage.x,
            right: stage.x + stage.width,
          };
        },
      }
      : undefined),
    createPopoverEl,
    {
      arrowElRef,
      popoverArrowPositioned,
      popoverOffset,
      popoverPadding,
      placement,
      zIndex: zIndex + 10,
      arrowPadding,
    },
  );

  state.popoverContext([popoverEl, destoryPopover]);

  // ---

  const destoryOverlay: () => void = () => {
    state.overlayDom()?.remove();
    state.overlayDom(undefined);
  };

  if (hideOverlay) {
    destoryOverlay();
  }
  else {
    if (!state.overlayDom()) {
      const overlaySvg = createOverlaySvg(
        stages || [],
        {
          stagePadding: options?.overlayPadding ?? 4,
          stageRadius: options?.overlayRadius ?? 4,
          zIndex,
          overlayOpacity,
        },
      );

      document.body.appendChild(overlaySvg);

      state.overlayDom(overlaySvg);
    }
    else {
      await transitionStage(
        stages || [],
        {
          stagePadding: options?.overlayPadding ?? 4,
          stageRadius: options?.overlayRadius ?? 4,
        },
      );
    }
  }

  return [
    destoryOverlay,
    destoryPopover,
  ];
}

export type { PopoverArrowPositionedHandler };
