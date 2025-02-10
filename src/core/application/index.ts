import type { Ref } from '@vue/reactivity';
import type { Tour } from '../logic';
import { useContext } from './context';

interface TourSchedulerConfig<T = string> {
  // eslint-disable-next-line ts/no-explicit-any
  tours: Map<T, Tour<any>>
  stateHandler: () => (T | undefined)
}

export class TourScheduler<
  T extends string = string,
  CT extends Map<string, unknown> = Map<string, unknown>,
> {
  public config: TourSchedulerConfig<T>;
  public context: Ref<CT>;

  constructor(_config: TourSchedulerConfig<T>) {
    this.config = _config;
    this.context = useContext().context as Ref<CT>;
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
