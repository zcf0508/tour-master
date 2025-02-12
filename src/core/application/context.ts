import type { ShallowRef } from '@vue/reactivity';
import { shallowRef } from '@vue/reactivity';

export function createContext<
  CT extends object = object,
>(initialContext?: CT): ShallowRef<Partial<CT>> {
  return shallowRef<CT>(initialContext || {} as CT) as ShallowRef<Partial<CT>>;
}
