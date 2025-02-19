import type { PopoverTemplate } from '../../src/core/logic';
import { toValue } from '@vue/reactivity';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tour } from '../../src/core/logic';

vi.mock('../../src/core/renderer/overlay', async (importOriginal) => {
  const mod = await importOriginal<object>();

  return {
    ...mod,
    transitionStage: vi.fn() as () => Promise<void>,
  };
});

describe('tour', () => {
  let mockPopoverTemplate: PopoverTemplate<unknown>;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="step1">Step 1</div>
      <div id="step2">Step 2</div>
    `;

    mockPopoverTemplate = vi.fn(() => {
      return () => document.createElement('div');
    });
  });

  it('element is a HTMLElement', async () => {
    const element = document.createElement('div');

    const tour = new Tour({
      steps: [
        {
          element,
          stages: () => {
            const rect = element.getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }];
          },
        },
      ],
      popoverTemplate: mockPopoverTemplate,
    });

    await tour.start();
    expect(mockPopoverTemplate).toHaveBeenCalled();
  });

  it('element is a function', async () => {
    const element = () => document.createElement('div');

    const tour = new Tour({
      steps: [
        {
          element,
          stages: () => {
            const rect = toValue(element).getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }];
          },
        },
      ],
      popoverTemplate: mockPopoverTemplate,
    });

    await tour.start();
    expect(mockPopoverTemplate).toHaveBeenCalled();
  });

  it('navigation', async () => {
    const mockEntry1 = vi.fn();
    const mockLeave1 = vi.fn();

    const mockEntry2 = vi.fn();
    const mockLeave2 = vi.fn();

    const tour = new Tour({
      steps: [
        {
          element: 'step1',
          stages: () => {
            const rect = document.getElementById('step1')!.getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }];
          },
          entry: mockEntry1,
          leave: mockLeave1,
        },
        {
          element: 'step2',
          stages: () => {
            const rect = document.getElementById('step2')!.getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }];
          },
          entry: mockEntry2,
          leave: mockLeave2,
        },
      ],
      popoverTemplate: mockPopoverTemplate,
    });

    await tour.start();

    expect(mockEntry1).toHaveBeenCalledWith('next');
    expect(mockPopoverTemplate).toHaveBeenCalled();

    // @ts-expect-error Trigger next
    await tour.handelNext();

    expect(mockLeave1).toHaveBeenCalledWith('next');
    expect(mockEntry2).toHaveBeenCalledWith('next');

    // @ts-expect-error Trigger previous
    await tour.handelPre();

    expect(mockLeave2).toHaveBeenCalledWith('pre');
    expect(mockEntry1).toHaveBeenCalledWith('pre');
  });

  it('should handle finish', async () => {
    const mockLeave = vi.fn();

    const tour = new Tour({
      steps: [
        {
          element: 'step1',
          stages: () => {
            const rect = document.getElementById('step1')!.getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }];
          },
          leave: mockLeave,
        },
      ],
      popoverTemplate: mockPopoverTemplate,
    });

    await tour.start();
    // @ts-expect-error Trigger finish by going to next step after last step
    await tour.handelNext();

    expect(mockLeave).toHaveBeenCalledWith('finish');
  });

  it('stop tour', async () => {
    const element = document.createElement('div');

    const mockStep2Entry = vi.fn();

    const tour = new Tour({
      steps: [
        {
          stages: () => {
            const rect = element.getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }];
          },
          leave: () => {
            tour.stop();
          },
        },
        {
          entry: mockStep2Entry,
          stages: () => {
            const rect = element.getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }];
          },
        },
      ],
      popoverTemplate: mockPopoverTemplate,
    });

    await tour.start();
    // @ts-expect-error Trigger next
    await tour.handelNext();

    expect(mockStep2Entry).not.toHaveBeenCalled();
  });

  it('should stop the tour during entry phase', async () => {
    const element = document.createElement('div');

    const mockStep1Leave = vi.fn();

    const tour = new Tour({
      steps: [
        {
          stages: () => {
            const rect = element.getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }];
          },
          entry: () => {
            tour.stop();
          },
          leave: mockStep1Leave,
        },
      ],
      popoverTemplate: mockPopoverTemplate,
    });

    await tour.start();

    expect(mockStep1Leave).not.toHaveBeenCalled();
  });

  it('onStart', () => {
    const onStart1 = vi.fn();
    const onStart2 = vi.fn();

    const tour = new Tour({
      onStart: onStart1,
      steps: [],
      popoverTemplate: mockPopoverTemplate,
    });

    tour.onStart(onStart2);

    tour.start();

    expect(onStart1).toHaveBeenCalled();
    expect(onStart2).toHaveBeenCalled();
  });

  it('onFinish', async () => {
    const onFinish1 = vi.fn();
    const onFinish2 = vi.fn();

    const tour = new Tour({
      onFinish: onFinish1,
      steps: [],
      popoverTemplate: mockPopoverTemplate,
    });

    tour.onFinish(onFinish2);

    await tour.start();
    // @ts-expect-error Trigger finish by going to next step after last step
    await tour.handelNext();

    expect(onFinish1).toHaveBeenCalled();
    expect(onFinish2).toHaveBeenCalled();
  });
});
