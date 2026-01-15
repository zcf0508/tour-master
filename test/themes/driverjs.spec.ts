import type { TourStep } from '../../src/core/logic';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDriverjsPopover } from '../../src/themes/driverjs';

describe('driverjs theme', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Clear injected styles if any (simulate fresh start)
    const style = document.getElementById('driverjs-theme-style');
    if (style) {
      style.remove();
    }
  });

  it('should inject styles into head', () => {
    createDriverjsPopover();
    // Simply creating the factory doesn't inject style, calling it does (or maybe inside the factory creation? Check impl)
    // Looking at impl: `createDriverjsPopover` calls `injectDriverjsStyles`.

    const style = document.getElementById('driverjs-theme-style');
    expect(style).toBeTruthy();
    expect(style?.innerHTML).toContain('.driverjs-theme-popover');
  });

  it('should create correct DOM structure', () => {
    const popoverFactory = createDriverjsPopover();
    const mockStep: TourStep & { title?: string, message: string } = {
      message: 'Hello World',
      title: 'Test Title',
    };

    const createPopover = popoverFactory({
      pre: () => {},
      next: () => {},
      finish: () => {},
      currentStep: mockStep,
      currentStepIndex: 0,
      stepTotal: 3,
    });

    const popoverEl = createPopover(() => {});

    expect(popoverEl.classList.contains('driverjs-theme-popover')).toBe(true);
    expect(popoverEl.querySelector('.driverjs-theme-popover-title')?.textContent).toBe('Test Title');
    expect(popoverEl.querySelector('.driverjs-theme-popover-description')?.innerHTML).toBe('Hello World');
    expect(popoverEl.querySelector('.driverjs-theme-popover-footer')).toBeTruthy();
    expect(popoverEl.querySelector('.driverjs-theme-popover-progress-text')?.textContent).toBe('1 of 3');

    // Check buttons
    const buttons = popoverEl.querySelectorAll('button');
    expect(buttons.length).toBe(1); // Only Next button for first step (no Pre)
    expect(buttons[0].textContent).toBe('Next');
  });

  it('should show Previous button on second step', () => {
    const popoverFactory = createDriverjsPopover();
    const mockStep: TourStep & { message: string } = {
      message: 'Step 2',
    };

    const createPopover = popoverFactory({
      pre: () => {},
      next: () => {},
      finish: () => {},
      currentStep: mockStep,
      currentStepIndex: 1,
      stepTotal: 3,
    });

    const popoverEl = createPopover(() => {});
    const buttons = popoverEl.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe('Previous');
    expect(buttons[1].textContent).toBe('Next');
  });

  it('should show Done button on last step', () => {
    const popoverFactory = createDriverjsPopover();
    const mockStep: TourStep & { message: string } = {
      message: 'Last Step',
    };

    const createPopover = popoverFactory({
      pre: () => {},
      next: () => {},
      finish: () => {},
      currentStep: mockStep,
      currentStepIndex: 2,
      stepTotal: 3,
    });

    const popoverEl = createPopover(() => {});
    const buttons = popoverEl.querySelectorAll('button');
    expect(buttons.length).toBe(2); // Pre + Done
    expect(buttons[1].textContent).toBe('Done');
  });
});
