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
  private currentTourName?: T;
  // eslint-disable-next-line ts/no-explicit-any
  private onFinishCallbacks: Map<Tour<any>, () => void> = new Map();

  constructor(_config: TourSchedulerConfig<T, CT>) {
    this.config = _config;
    this.tours = new Map(_config.tours);
    this.context = createContext(_config.initialContext);
  }

  /** start the next tour */
  public async startTour(): Promise<void> {
    const nextTourName = this.config.stateHandler();
    if (!nextTourName) {
      return;
    }

    const nextTour = this.tours.get(nextTourName);
    if (!nextTour) {
      return;
    }

    if (!this.onFinishCallbacks.has(nextTour)) {
      const unregister = nextTour.hook('finish', () => {
        this.currentTourName = undefined;
      });
      this.onFinishCallbacks.set(nextTour, unregister);
    }
    this.currentTourName = nextTourName;

    await nextTour.start();
  }

  /** stop the current tour */
  public async stopTour(): Promise<void> {
    if (!this.currentTourName) {
      return;
    }

    const currentTour = this.tours.get(this.currentTourName);
    if (!currentTour) {
      return;
    }

    await currentTour.stop();

    this.currentTourName = undefined;
    this.onFinishCallbacks.delete(currentTour);
  }
}
