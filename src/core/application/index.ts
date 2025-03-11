import type { MaybeRefOrGetter } from '@vue/reactivity';
import type { Tour } from '../logic';
import { toValue } from '@vue/reactivity';
import { createContext } from './context';

interface TourSchedulerConfig<T = string, CT = object> {
  // eslint-disable-next-line ts/no-explicit-any
  tours: Array<[T, MaybeRefOrGetter<Tour<any>>]>
  stateHandler: () => (Promise<(T | undefined)> | (T | undefined))
  initialContext?: CT
}

export class TourScheduler<
  T extends string = string,
  CT extends object = object,
> {
  public config: TourSchedulerConfig<T>;
  // eslint-disable-next-line ts/no-explicit-any
  private _tours: Map<T, MaybeRefOrGetter<Tour<any>>>;
  // eslint-disable-next-line ts/no-explicit-any
  private _tourInstances: Map<T, Tour<any>> = new Map();
  public context: ReturnType<typeof createContext<CT>>;
  private currentTourName?: T;
  // eslint-disable-next-line ts/no-explicit-any
  private onFinishCallbacks: Map<Tour<any>, () => void> = new Map();

  constructor(_config: TourSchedulerConfig<T, CT>) {
    this.config = _config;
    this._tours = new Map(_config.tours);
    this.context = createContext(_config.initialContext);
  }

  /** start the next tour */
  public async startTour(): Promise<void> {
    const nextTourName = await this.config.stateHandler();
    if (!nextTourName) {
      return;
    }

    const nextTour = this._tours.get(nextTourName);
    if (!nextTour) {
      return;
    }
    const nextTourInstance = toValue(nextTour);

    this._tourInstances.set(nextTourName, nextTourInstance);

    if (!this.onFinishCallbacks.has(nextTourInstance)) {
      const unregister = nextTourInstance.hook('finish', () => {
        this.currentTourName = undefined;
      });
      this.onFinishCallbacks.set(nextTourInstance, unregister);
    }
    this.currentTourName = nextTourName;

    await nextTourInstance.start();
  }

  /** stop the current tour */
  public async stopTour(): Promise<void> {
    if (!this.currentTourName) {
      return;
    }

    const currentTour = this._tourInstances.get(this.currentTourName);
    if (!currentTour) {
      return;
    }

    await currentTour.stop();

    this._tourInstances.delete(this.currentTourName);

    this.currentTourName = undefined;
    this.onFinishCallbacks.delete(currentTour);
  }
}
