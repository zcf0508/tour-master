import type { Placement } from '@floating-ui/dom';
import type { MaybeRef } from '@vue/reactivity';
import type { StageDefinition } from './overlay';
import type { PopoverArrowPositionedHandler } from './popover';
import { toValue } from '@vue/reactivity';
import { useGlobalState } from '../../store';
import { createOverlaySvg, transitionStage } from './overlay';
import { showPopover } from './popover';

export async function showStep(
  referenceEl: MaybeRef<HTMLElement>,
  createPopoverEl: () => MaybeRef<HTMLElement>,
  stages: StageDefinition[] | (() => StageDefinition[]),
  options?: Partial<{
    arrowElRef?: MaybeRef<HTMLElement | undefined>
    popoverArrowPositioned?: PopoverArrowPositionedHandler
    overlayOpacity: number
    placement: Placement
    zIndex: number
  }>,
): Promise<[() => void, () => void]> {
  const {
    arrowElRef,
    popoverArrowPositioned,
    overlayOpacity,
    placement = 'bottom',
    zIndex = 10000,
  } = options || {};

  const state = useGlobalState();

  // ---

  if (state.popoverContext.value) {
    state.popoverContext.value[1]();
  }

  const [popoverEl, destoryPopover] = showPopover(
    referenceEl,
    createPopoverEl,
    {
      arrowElRef,
      popoverArrowPositioned,
      placement,
      zIndex: zIndex + 1,
    },
  );

  state.popoverContext.value = [popoverEl, destoryPopover];

  // ---

  if (!state.overlayDom.value) {
    const overlaySvg = createOverlaySvg(
      toValue(stages),
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
      toValue(stages),
      {
        stagePadding: 4,
        stageRadius: 4,
      },
    );
  }

  const destoryOverlay: () => void = () => {
    state.overlayDom.value?.remove();
    state.overlayDom.value = undefined;
  };

  return [
    destoryOverlay,
    destoryPopover,
  ];
}
