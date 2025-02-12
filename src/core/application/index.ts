import type { ShallowRef } from '@vue/reactivity';
import type { Tour } from '../logic';
import { createContext } from './context';

interface TourSchedulerConfig<T = string, CT = object> {
  // eslint-disable-next-line ts/no-explicit-any
  tours: Map<T, Tour<any>>
  stateHandler: () => (T | undefined)
  initialContext?: CT
}

export class TourScheduler<
  T extends string = string,
  CT extends object = object,
> {
  public config: TourSchedulerConfig<T>;
  public context: ShallowRef<Partial<CT>>;

  constructor(_config: TourSchedulerConfig<T, CT>) {
    this.config = _config;
    this.context = createContext(_config.initialContext);
  }

  /** start the next tour */
  public startTour(): void {
    const nextTourName = this.config.stateHandler();
    if (!nextTourName) {
      return;
    }

    const nextTour = this.config.tours.get(nextTourName);
    if (!nextTour) {
      return;
    }

    nextTour.start();
  }
}
