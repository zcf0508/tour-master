import type { TooltipTemplate } from '../../src/core/logic';
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
  let mockTooltipTemplate: TooltipTemplate<unknown>;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="step1">Step 1</div>
      <div id="step2">Step 2</div>
    `;

    mockTooltipTemplate = vi.fn(() => {
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
      tooltipTemplate: mockTooltipTemplate,
    });

    await tour.start();
    expect(mockTooltipTemplate).toHaveBeenCalled();
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
      tooltipTemplate: mockTooltipTemplate,
    });

    await tour.start();
    expect(mockTooltipTemplate).toHaveBeenCalled();
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
      tooltipTemplate: mockTooltipTemplate,
    });

    await tour.start();

    expect(mockEntry1).toHaveBeenCalledWith('next');
    expect(mockTooltipTemplate).toHaveBeenCalled();

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
      tooltipTemplate: mockTooltipTemplate,
    });

    await tour.start();
    // @ts-expect-error Trigger finish by going to next step after last step
    await tour.handelNext();

    expect(mockLeave).toHaveBeenCalledWith('finish');
  });
});
