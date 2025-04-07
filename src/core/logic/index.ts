import type { OffsetOptions, Placement, ReferenceElement } from '@floating-ui/dom';
import type { HookCallback } from 'hookable';
import type { StageDefinition } from '../renderer/overlay';
import type { PopoverArrowPositionedHandler } from '../renderer/popover';
import { ref, toValue } from '@vue/reactivity';
import { Hookable } from 'hookable';
import { showStep } from '../renderer';

interface TourStep {
  element?: string | ReferenceElement | (() => ReferenceElement)
  stages?: StageDefinition[] | (() => StageDefinition[])
  entry?: (action: 'pre' | 'next') => void | Promise<void>
  leave?: (action: 'pre' | 'next' | 'finish') => void | Promise<void>
  placement?: Placement
  /** default: false */
  hideOverlay?: boolean
  offset?: OffsetOptions
  padding?: number
  arrowPadding?: number
}

type BindArrowEl = ((arrowEl: HTMLElement) => void);

export type PopoverTemplate<T> = (_: {
  pre: () => void
  next: () => void
  finish: () => void
  currentStep: TourStep & T
  currentStepIndex: number
  stepTotal: number
}) => ((bindArrowEl: BindArrowEl) => HTMLElement);

interface TourConfig<T = undefined> {
  steps: Array<TourStep & T>
  popoverTemplate: PopoverTemplate<T>
  popoverArrowPositioned?: PopoverArrowPositionedHandler
  popoverOffset?: OffsetOptions
  popoverPadding?: number
  zIndex?: number
  overlayOpacity?: number
  arrowPadding?: number
  /**
   * If set, the tour will only show once.
   */
  storageKey?: string
  /**
   * If set, the tour will lock the scroll.
   *
   * @default false
   */
  lockScroll?: boolean
  /** call before start */
  onStart?: (() => void) | (() => Promise<void>)
  /** call after finish */
  onFinish?: (() => void) | (() => Promise<void>)
}

export class Tour<T extends object | undefined> extends Hookable<{
  start: HookCallback
  finish: HookCallback
}> {
  private config: TourConfig<T>;
  private stepIndex: number;
  private destroyDoms?: () => void;
  private isStopped: boolean = false; // Add a flag to track if the tour is stopped

  constructor(_config: TourConfig<T extends { length: number } ? never : T>) {
    super();

    this.config = _config as unknown as TourConfig<T>;
    this.stepIndex = -1;

    if (this.config.onStart) {
      this.hook('start', this.config.onStart);
    }

    if (this.config.onFinish) {
      this.hook('finish', this.config.onFinish);
    }

    if (this.config.lockScroll) {
      const oldOverflow = document.body.style.overflow;

      this.hook('start', () => {
        document.body.style.overflow = 'hidden';
      });
      this.hook('finish', () => {
        document.body.style.overflow = oldOverflow;
      });
    }
  }

  private async runOnStarts(): Promise<void> {
    await this.callHook('start');
  }

  private async runOnFinishs(): Promise<void> {
    await this.callHook('finish');
  }

  private get currentStep(): (TourStep & T) | undefined {
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

    await this.currentStep?.entry?.(action);

    const referenceEl = toValue((() => {
      const ele = this.currentStep?.element;
      if (typeof ele === 'string') {
        const element = document.querySelector(ele);
        if (!element) {
          console.error(`Element ${ele} not found in step ${this.stepIndex}`);
          return;
        }
        return element;
      }
      else {
        return ele;
      }
    })());

    if (this.isStopped) {
      return;
    } // Prevent further execution if stopped

    if (!this.currentStep) {
      return;
    }

    const arrowElRef = ref<HTMLElement>();

    const [destoryOverlay, destoryPopover] = await showStep(
      () => {
        const handelPre = this.handelPre.bind(this);
        const handelNext = this.handelNext.bind(this);
        const handelFinish = this.handelFinish.bind(this);
        const currentStep = this.currentStep!;
        const stepTotal = this.config.steps.length;
        const createPopoverEl = this.config.popoverTemplate({
          pre: handelPre,
          next: handelNext,
          finish: handelFinish,
          currentStep,
          currentStepIndex: index,
          stepTotal,
        });
        return createPopoverEl((arrowEl: HTMLElement) => {
          arrowElRef.value = arrowEl;
        });
      },
      referenceEl,
      referenceEl
        ? () => {
          const referenceElRect = referenceEl.getBoundingClientRect();
          return [
            {
              x: referenceElRect.x,
              y: referenceElRect.y,
              width: referenceElRect.width,
              height: referenceElRect.height,
            },
          ];
        }
        : this.currentStep.stages,
      {
        arrowElRef,
        popoverArrowPositioned: this.config.popoverArrowPositioned,
        popoverOffset: this.currentStep?.offset ?? this.config.popoverOffset,
        popoverPadding: this.currentStep?.padding ?? this.config.popoverPadding,
        placement: this.currentStep.placement,
        zIndex: this.config.zIndex,
        overlayOpacity: this.config.overlayOpacity,
        hideOverlay: this.currentStep.hideOverlay,
        arrowPadding: this.currentStep?.arrowPadding ?? this.config.arrowPadding,
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
    this.isStopped = true;

    this.destroyDoms?.();
    this.destroyDoms = undefined;

    await this.currentStep?.leave?.('finish');
    await this.runOnFinishs();

    this.stepIndex = -1;
  }

  public async start(): Promise<void> {
    if (this.config.storageKey) {
      if (localStorage.getItem(this.config.storageKey) === 'true') {
        return;
      }

      localStorage.setItem(this.config.storageKey, 'true');
    }

    this.isStopped = false; // Reset the stopped flag
    await this.runOnStarts();
    await this.showStep(0, 'next');
  }

  public async stop(): Promise<void> {
    if (this.isStopped) {
      return;
    } // Prevent multiple stops

    this.isStopped = true;

    this.destroyDoms?.();
    this.destroyDoms = undefined;

    await this.runOnFinishs();

    this.stepIndex = -1;
  }
}
