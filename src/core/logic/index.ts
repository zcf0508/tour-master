import { toValue } from '@vue/reactivity';
import { showStep } from '../renderer';

interface TourStep {
  element: string | HTMLElement | (() => HTMLElement)
  entry?: (action: 'pre' | 'next') => void | Promise<void>
  leave?: (action: 'pre' | 'next' | 'finish') => void | Promise<void>
}

interface TourConfig<T = undefined> {
  steps: Array<TourStep & T>
  tooltipTemplate: (
    pre: () => void,
    next: () => void,
    finish: () => void,
    currentStep: TourStep & T,
    currentStepIndex: number,
  ) => (T extends undefined ? (() => HTMLElement) : ((options: T) => HTMLElement))
}

export class Tour<T extends Record<string, unknown> | undefined = undefined> {
  private config: TourConfig<T>;
  private stepIndex: number;
  private destroy?: () => void;

  constructor(_config: TourConfig<T>) {
    this.config = _config;
    this.stepIndex = -1;
  }

  private get currentStep(): TourStep & T {
    return this.config.steps[this.stepIndex];
  }

  private async showStep(index: number, action: 'pre' | 'next'): Promise<void> {
    if (index >= this.config.steps.length) {
      return this.handelFinish();
    }

    if (index < 0 || index > this.config.steps.length - 1) {
      return;
    }

    const lastStep = this.config.steps[this.stepIndex] as TourStep & T | undefined;

    await lastStep?.leave?.(action);

    this.stepIndex = index;

    const referenceEl = toValue((() => {
      const ele = this.currentStep.element;
      if (typeof ele === 'string') {
        return document.getElementById(ele) as HTMLElement;
      }
      else {
        return ele;
      }
    })());

    await this.currentStep.entry?.(action);

    const [destoryOverlay, destoryTooltip] = await showStep(
      referenceEl,
      () => {
        const handelPre = this.handelPre.bind(this);
        const handelNext = this.handelNext.bind(this);
        const handelFinish = this.handelFinish.bind(this);
        const currentStep = this.currentStep;

        const createTooltipEl = this.config.tooltipTemplate(
          handelPre,
          handelNext,
          handelFinish,
          currentStep,
          index,
        );
        return createTooltipEl(currentStep);
      },
      () => {
        const referenceElRect = referenceEl.getBoundingClientRect();

        return [
          {
            x: referenceElRect.left,
            y: referenceElRect.top,
            width: referenceElRect.width,
            height: referenceElRect.height,
          },
        ];
      },
    );

    this.destroy = () => {
      destoryOverlay();
      destoryTooltip();
    };
  }

  private handelNext(): void {
    this.showStep(this.stepIndex + 1, 'next');
  }

  private handelPre(): void {
    this.showStep(this.stepIndex - 1, 'pre');
  }

  private async handelFinish(): Promise<void> {
    this.destroy?.();
    this.destroy = undefined;

    await this.currentStep.leave?.('finish');
    this.stepIndex = -1;
  }

  public start(): void {
    this.showStep(0, 'next');
  }
}
