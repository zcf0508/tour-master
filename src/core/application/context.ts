import { signal } from 'alien-signals';

export function createContext<
  CT extends object = object,
>(initialContext?: CT): {
  /** cleanup the context, or a specific key */
  cleanup: <K extends keyof CT>(key?: K) => void
  set: <K extends keyof CT, V extends CT[K]>(key: K, value: V) => () => void
  get: <K extends keyof CT>(key: K) => (CT[K] | undefined)
} {
  const ctx = signal<CT>(initialContext || {} as CT);

  return {
    set: (key, value) => {
      ctx({
        ...ctx(),
        [key]: value,
      });
      return () => {
        ctx({
          ...ctx(),
          [key]: undefined,
        });
      };
    },
    cleanup: (key) => {
      if (key) {
        ctx({
          ...ctx(),
          [key]: undefined,
        });
      }
      else {
        ctx({} as CT);
      }
    },
    get: (key) => {
      return ctx()[key];
    },
  };
}
