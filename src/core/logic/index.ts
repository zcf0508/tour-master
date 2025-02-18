import type { Placement } from '@floating-ui/dom';
import type { StageDefinition } from '../renderer/overlay';
import type { PopoverArrowPositionedHandler } from '../renderer/popover';
import { ref, toValue } from '@vue/reactivity';
import { showStep } from '../renderer';

interface TourStep {
  element?: string | HTMLElement | (() => HTMLElement)
  stages?: StageDefinition[] | (() => StageDefinition[])
  entry?: (action: 'pre' | 'next') => void | Promise<void>
  leave?: (action: 'pre' | 'next' | 'finish') => void | Promise<void>
  placement?: Placement
}

type BindArrowEl = ((arrowEl: HTMLElement) => void);

export type PopoverTemplate<T> = (
  pre: () => void,
  next: () => void,
  finish: () => void,
  currentStep: TourStep & T,
  currentStepIndex: number,
  stepTotal: number,
) => ((bindArrowEl: BindArrowEl) => HTMLElement);

interface TourConfig<T = undefined> {
  steps: Array<TourStep & T>
  popoverTemplate: PopoverTemplate<T>
  popoverArrowPositioned?: PopoverArrowPositionedHandler
  popoverOffset?: number
  popoverPadding?: number
  zIndex?: number
  overlayOpacity?: number
  /** call before start */
  onStart?: (() => void) | (() => Promise<void>)
  /** call after finish */
  onFinish?: (() => void) | (() => Promise<void>)
}

export class Tour<T extends Record<string, unknown> | undefined> {
  private config: TourConfig<T>;
  private stepIndex: number;
  private destroyDoms?: () => void;
  private isStopped: boolean = false; // Add a flag to track if the tour is stopped

  constructor(_config: TourConfig<T>) {
    this.config = _config;
    this.stepIndex = -1;
  }

  private get currentStep(): TourStep & T {
    return this.config.steps[this.stepIndex];
  }

  private async showStep(index: number, action: 'pre' | 'next'): Promise<void> {
    if (index >= this.config.steps.length) {
      return await this.handelFinish();
    }

    if (index < 0 || index > this.config.steps.length - 1) {
      return;
    }

    const lastStep = this.config.steps[this.stepIndex] as TourStep & T | undefined;

    await lastStep?.leave?.(action);

    if (this.isStopped) {
      return;
    } // Prevent further execution if stopped

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

    if (!toValue(this.currentStep.stages)?.length && !referenceEl) {
      throw new Error('At least one stage or a reference element needs to be provided.');
    }

    await this.currentStep.entry?.(action);

    const arrowElRef = ref<HTMLElement>();

    const [destoryOverlay, destoryPopover] = await showStep(
      () => {
        const handelPre = this.handelPre.bind(this);
        const handelNext = this.handelNext.bind(this);
        const handelFinish = this.handelFinish.bind(this);
        const currentStep = this.currentStep;
        const stepTotal = this.config.steps.length;
        const createPopoverEl = this.config.popoverTemplate(
          handelPre,
          handelNext,
          handelFinish,
          currentStep,
          index,
          stepTotal,
        );
        return createPopoverEl((arrowEl: HTMLElement) => {
          arrowElRef.value = arrowEl;
        });
      },
      this.currentStep.stages ?? (() => {
        if (!referenceEl) {
          return [];
        }

        const referenceElRect = referenceEl.getBoundingClientRect();

        return [
          {
            x: referenceElRect.x,
            y: referenceElRect.y,
            width: referenceElRect.width,
            height: referenceElRect.height,
          },
        ];
      }),
      {
        arrowElRef,
        popoverArrowPositioned: this.config.popoverArrowPositioned,
        popoverOffset: this.config.popoverOffset,
        popoverPadding: this.config.popoverPadding,
        placement: this.currentStep.placement,
        zIndex: this.config.zIndex,
        overlayOpacity: this.config.overlayOpacity,
      },
    );

    this.destroyDoms = () => {
      destoryOverlay();
      destoryPopover();
    };
  }

  private async handelNext(): Promise<void> {
    await this.showStep(this.stepIndex + 1, 'next');
  }

  private async handelPre(): Promise<void> {
    await this.showStep(this.stepIndex - 1, 'pre');
  }

  private async handelFinish(): Promise<void> {
    this.destroyDoms?.();
    this.destroyDoms = undefined;

    await this.currentStep.leave?.('finish');
    await this.config.onFinish?.();

    this.stepIndex = -1;
  }

  public async start(): Promise<void> {
    this.isStopped = false; // Reset the stopped flag
    await this.config.onStart?.();
    await this.showStep(0, 'next');
  }

  public async stop(): Promise<void> {
    if (this.isStopped) {
      return;
    } // Prevent multiple stops

    this.isStopped = true;

    this.destroyDoms?.();
    this.destroyDoms = undefined;

    await this.config.onFinish?.();

    this.stepIndex = -1;
  }
}
