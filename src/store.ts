import type { showPopover } from './core/renderer/popover';
import type { StageDefinition } from './core/renderer/types';
import { signal } from 'alien-signals';
import { refreshOverlay } from './core/renderer/overlay';
import { createGlobalState } from './utils';

const createStore = createGlobalState(() => {
  const overlayDom = signal<SVGSVGElement>();
  const currentStages = signal<StageDefinition[] | (() => StageDefinition[])>();
  const cachedStages = signal<StageDefinition[]>([]);

  window.addEventListener('resize', () => {
    refreshOverlay();
  });

  window.addEventListener('scroll', () => {
    refreshOverlay();
  });

  const popoverContext = signal<ReturnType<typeof showPopover>>();

  return {
    overlayDom,
    currentStages,
    cachedStages,
    popoverContext,
  };
});

export function useGlobalState(): ReturnType<typeof createStore> {
  const store = createStore();
  return store;
}
