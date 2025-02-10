import { ref } from '@vue/reactivity';
import { createGlobalState } from '@vueuse/core';

const createContext = createGlobalState(() => {
  const context = ref<Map<string, unknown>>(new Map());

  return {
    context,
  };
});

export function useContext(): ReturnType<typeof createContext> {
  return createContext();
}
