import type { OffsetOptions, Placement, ReferenceElement } from '@floating-ui/dom';
import type { MaybeRef, Ref } from '@vue/reactivity';
import type { StageDefinition } from './overlay';
import type { PopoverArrowPositionedHandler } from './popover';
import { toValue } from '@vue/reactivity';
import { useGlobalState } from '../../store';
import { createOverlaySvg, transitionStage } from './overlay';
import { showPopover } from './popover';

export async function showStep(
  createPopoverEl: () => MaybeRef<HTMLElement>,
  element?: ReferenceElement | (() => ReferenceElement),
  stages?: StageDefinition[] | (() => StageDefinition[]),
  options?: Partial<{
    arrowElRef?: Ref<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    popoverPadding?: number
    popoverOffset?: OffsetOptions
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

  if (state.popoverContext.value) {
    state.popoverContext.value[1]();
  }

  const stagesVal = toValue(stages);

  const [popoverEl, destoryPopover] = showPopover(
    toValue(element) ?? (stagesVal?.length
      ? {
        getBoundingClientRect: () => {
          const stage = stagesVal[0]!;

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
      zIndex: zIndex + 1,
      arrowPadding,
    },
  );

  state.popoverContext.value = [popoverEl, destoryPopover];

  // ---

  const destoryOverlay: () => void = () => {
    state.overlayDom.value?.remove();
    state.overlayDom.value = undefined;
  };

  if (hideOverlay) {
    destoryOverlay();
  }
  else {
    if (!state.overlayDom.value) {
      const overlaySvg = createOverlaySvg(
        stages || [],
        {
          stagePadding: 4,
          stageRadius: 4,
          zIndex,
          overlayOpacity,
        },
      );

      document.body.appendChild(overlaySvg);

      state.overlayDom.value = overlaySvg;
    }
    else {
      await transitionStage(
        stages || [],
        {
          stagePadding: 4,
          stageRadius: 4,
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
