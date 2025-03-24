import type { StageDefinition } from './core/renderer/overlay';
import type { showPopover } from './core/renderer/popover';
import { ref } from '@vue/reactivity';
import { createGlobalState } from '@vueuse/shared';
import { refreshOverlay } from './core/renderer/overlay';

const createStore = createGlobalState(() => {
  const overlayDom = ref<SVGSVGElement>();
  const currentStages = ref<StageDefinition[] | (() => StageDefinition[])>();

  window.addEventListener('resize', () => {
    refreshOverlay();
  });

  window.addEventListener('scroll', () => {
    refreshOverlay();
  });

  const popoverContext = ref<ReturnType<typeof showPopover>>();

  return {
    overlayDom,
    currentStages,
    popoverContext,
  };
});

export function useGlobalState(): ReturnType<typeof createStore> {
  const store = createStore();
  return store;
}
