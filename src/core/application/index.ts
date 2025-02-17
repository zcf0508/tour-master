import type { ShallowRef } from '@vue/reactivity';
import type { Tour } from '../logic';
import { createContext } from './context';

interface TourSchedulerConfig<T = string, CT = object> {
  // eslint-disable-next-line ts/no-explicit-any
  tours: Array<[T, Tour<any>]>
  stateHandler: () => (T | undefined)
  initialContext?: CT
}

export class TourScheduler<
  T extends string = string,
  CT extends object = object,
> {
  public config: TourSchedulerConfig<T>;
  // eslint-disable-next-line ts/no-explicit-any
  private tours: Map<T, Tour<any>>;
  public context: ReturnType<typeof createContext<CT>>;

  constructor(_config: TourSchedulerConfig<T, CT>) {
    this.config = _config;
    this.tours = new Map(_config.tours);
    this.context = createContext(_config.initialContext);
  }

  /** start the next tour */
  public startTour(): void {
    const nextTourName = this.config.stateHandler();
    if (!nextTourName) {
      return;
    }

    const nextTour = this.tours.get(nextTourName);
    if (!nextTour) {
      return;
    }

    nextTour.start();
  }
}
