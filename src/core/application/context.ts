import type { Ref } from '@vue/reactivity';
import { ref } from '@vue/reactivity';

export function createContext<CT extends object = object>(initialContext?: CT): Ref<Partial<CT>> {
  return ref<CT>(initialContext || {} as CT) as Ref<Partial<CT>>;
}
