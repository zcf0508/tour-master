import type { StageDefinition } from './core/renderer/overlay';
import type { showPopover } from './core/renderer/popover';
import { ref } from '@vue/reactivity';
import { createGlobalState, useEventListener } from '@vueuse/core';
import { refreshOverlay } from './core/renderer/overlay';

const createStore = createGlobalState(() => {
  const overlayDom = ref<SVGSVGElement>();
  const currentStages = ref<StageDefinition[]>();

  useEventListener(window, 'resize', () => {
    refreshOverlay();
  });

  const tooltip = ref<ReturnType<typeof showPopover>>();

  return {
    overlayDom,
    currentStages,
    tooltip,
  };
});

export function useGlobalState(): ReturnType<typeof createStore> {
  const store = createStore();
  return store;
}
