import type { MaybeRef } from '@vue/reactivity';
import type { StageDefinition } from './overlay';
import { toValue } from '@vue/reactivity';
import { useGlobalState } from '../../store';
import { createOverlaySvg } from './overlay';
import { showPopover } from './popover';

export function showStep(
  referenceEl: MaybeRef<HTMLElement>,
  createTooltipEl: () => MaybeRef<HTMLElement>,
  stages: StageDefinition[] | (() => StageDefinition[]),
): void {
  const state = useGlobalState();

  const overlaySvg = createOverlaySvg(
    toValue(stages),
    {
      stagePadding: 4,
      stageRadius: 4,
    },
  );

  document.body.appendChild(overlaySvg);

  state.overlayDom.value = overlaySvg;

  showPopover(
    referenceEl,
    createTooltipEl,
  );
}
