import type { MaybeRef } from '@vue/reactivity';
import type { StageDefinition } from './overlay';
import { toValue } from '@vue/reactivity';
import { useGlobalState } from '../../store';
import { createOverlaySvg, transitionStage } from './overlay';
import { showPopover } from './popover';

export async function showStep(
  referenceEl: MaybeRef<HTMLElement>,
  createPopoverEl: () => MaybeRef<HTMLElement>,
  stages: StageDefinition[] | (() => StageDefinition[]),  
): Promise<[() => void, () => void]> {
  const state = useGlobalState();

  // ---

  if (state.popoverContext.value) {
    state.popoverContext.value[1]();
  }

  const [popoverEl, destoryTooltip] = showPopover(
    referenceEl,
    createPopoverEl,
  );

  state.popoverContext.value = [popoverEl, destoryTooltip];

  // ---

  if (!state.overlayDom.value) {
    const overlaySvg = createOverlaySvg(
      toValue(stages),
      {
        stagePadding: 4,
        stageRadius: 4,
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
    destoryTooltip,
  ];
}
