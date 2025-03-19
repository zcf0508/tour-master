import type { ShallowRef } from '@vue/reactivity';
import { shallowRef } from '@vue/reactivity';

export function createContext<
  CT extends object = object,
>(initialContext?: CT): {
  /** cleanup the context, or a specific key */
  cleanup: <K extends keyof CT>(key?: K) => void
  set: <K extends keyof CT, V extends CT[K]>(key: K, value: V) => () => void
  get: <K extends keyof CT>(key: K) => (CT[K] | undefined)
} {
  const ctx = shallowRef<CT>(initialContext || {} as CT) as ShallowRef<Partial<CT>>;

  return {
    set: (key, value) => {
      ctx.value = {
        ...ctx.value,
        [key]: value,
      };
      return () => {
        ctx.value = {
          ...ctx.value,
          [key]: undefined,
        };
      };
    },
    cleanup: (key) => {
      if (key) {
        ctx.value = {
          ...ctx.value,
          [key]: undefined,
        };
      }
      else {
        ctx.value = {};
      }
    },
    get: (key) => {
      return ctx.value[key];
    },
  };
}
