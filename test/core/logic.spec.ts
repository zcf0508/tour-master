import type { PopoverTemplate } from '../../src/core/logic';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tour } from '../../src/core/logic';
import { useGlobalState } from '../../src/store';
import { toValue } from '../../src/utils';

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

  it('onStart', async () => {
    const onStart1 = vi.fn();
    const onStart2 = vi.fn();

    const tour = new Tour({
      onStart: onStart1,
      steps: [],
      popoverTemplate: mockPopoverTemplate,
    });

    tour.hook('start', onStart2);

    await tour.start();

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

    tour.hook('finish', onFinish2);

    await tour.start();
    // @ts-expect-error Trigger finish by going to next step after last step
    await tour.handelNext();

    expect(onFinish1).toHaveBeenCalled();
    expect(onFinish2).toHaveBeenCalled();
  });

  it('storageKey', async () => {
    const onStart = vi.fn();

    localStorage.removeItem('tour');

    const tour = new Tour({
      storageKey: 'tour',
      steps: [],
      popoverTemplate: mockPopoverTemplate,
      onStart,
    });

    await tour.start();

    expect(localStorage.getItem('tour')).toBe('true');

    expect(onStart).toBeCalledTimes(1);

    await tour.start();

    expect(onStart).toBeCalledTimes(1);
  });

  describe('stages caching with padding and radius', () => {
    it('should cache stages with correct padding and radius', async () => {
      const state = useGlobalState();

      const tour = new Tour({
        steps: [
          {
            element: () => document.getElementById('step1')!,
            stages: () => {
              const rect = document.getElementById('step1')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 10,
            overlayRadius: 5,
          },
        ],
        popoverTemplate: mockPopoverTemplate,
      });

      await tour.start();

      // Verify cached stages have correct padding and radius
      expect(state.cachedStages()).toEqual([{
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
        padding: 10,
        radius: 5,
      }]);
    });

    it('should maintain correct stages after resize', async () => {
      const state = useGlobalState();

      const tour = new Tour({
        steps: [
          {
            element: () => document.getElementById('step1')!,
            stages: () => {
              const rect = document.getElementById('step1')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 12,
            overlayRadius: 6,
          },
        ],
        popoverTemplate: mockPopoverTemplate,
      });

      await tour.start();

      // Store the cached stages
      const cachedAfterStart = [...state.cachedStages()];
      expect(cachedAfterStart).toEqual([{
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
        padding: 12,
        radius: 6,
      }]);

      // Trigger resize (this will call refreshOverlay internally)
      window.dispatchEvent(new Event('resize'));

      // Wait for resize handler
      await vi.waitFor(() => {
        // After resize, cached stages should still have correct padding/radius
        expect(state.cachedStages()).toEqual(cachedAfterStart);
      });

      // Verify the currentStages also has correct padding/radius
      const currentStages = state.currentStages();
      if (currentStages) {
        const resolved = toValue(currentStages);
        expect(resolved[0].padding).toBe(12);
        expect(resolved[0].radius).toBe(6);
      }
    });

    it('should handle transition between steps with cached stages', async () => {
      const state = useGlobalState();

      const tour = new Tour({
        steps: [
          {
            element: () => document.getElementById('step1')!,
            stages: () => {
              const rect = document.getElementById('step1')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 10,
            overlayRadius: 5,
          },
          {
            element: () => document.getElementById('step2')!,
            stages: () => {
              const rect = document.getElementById('step2')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 15,
            overlayRadius: 7,
          },
        ],
        popoverTemplate: mockPopoverTemplate,
      });

      await tour.start();

      // Verify first step's cached stages
      const step1Cache = [...state.cachedStages()];
      expect(step1Cache[0].padding).toBe(10);
      expect(step1Cache[0].radius).toBe(5);

      // Navigate to second step
      // @ts-expect-error Trigger next
      await tour.handelNext();

      // Verify second step's cached stages (should be updated)
      const step2Cache = [...state.cachedStages()];
      expect(step2Cache[0].padding).toBe(15);
      expect(step2Cache[0].radius).toBe(7);

      // Navigate back to first step
      // @ts-expect-error Trigger pre
      await tour.handelPre();

      // Verify we're back to first step's cached stages
      const backToStep1Cache = [...state.cachedStages()];
      expect(backToStep1Cache[0].padding).toBe(10);
      expect(backToStep1Cache[0].radius).toBe(5);
    });

    it('should use cached value when currentStages function throws error on next', async () => {
      const state = useGlobalState();
      let element1Exists = true;

      const tour = new Tour({
        steps: [
          {
            element: () => document.getElementById('step1')!,
            stages: () => {
              if (!element1Exists) {
                throw new Error('Step1 element destroyed');
              }
              const rect = document.getElementById('step1')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 10,
            overlayRadius: 5,
          },
          {
            element: () => document.getElementById('step2')!,
            stages: () => {
              const rect = document.getElementById('step2')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 15,
            overlayRadius: 7,
          },
        ],
        popoverTemplate: mockPopoverTemplate,
      });

      await tour.start();

      // Cache Step1's stages
      const step1Cache = [...state.cachedStages()];
      expect(step1Cache[0].padding).toBe(10);
      expect(step1Cache[0].radius).toBe(5);

      // Simulate Step1 element being destroyed before next
      element1Exists = false;
      document.getElementById('step1')?.remove();

      // Navigate to Step2 - this should trigger transition
      // The transition will try to get fromStages from currentStages
      // If currentStages is a function that now throws, it should use cache
      // @ts-expect-error Trigger next
      await tour.handelNext();

      // Should successfully transition to Step2 with its own stages
      const step2Cache = [...state.cachedStages()];
      expect(step2Cache[0].padding).toBe(15);
      expect(step2Cache[0].radius).toBe(7);
    });

    it('should use cached value when currentStages function returns empty array on next', async () => {
      const state = useGlobalState();
      let shouldReturnEmpty = false;

      const tour = new Tour({
        steps: [
          {
            element: () => document.getElementById('step1')!,
            stages: () => {
              if (shouldReturnEmpty) {
                return []; // Return empty array
              }
              const rect = document.getElementById('step1')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 8,
            overlayRadius: 4,
          },
          {
            element: () => document.getElementById('step2')!,
            stages: () => {
              const rect = document.getElementById('step2')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 12,
            overlayRadius: 6,
          },
        ],
        popoverTemplate: mockPopoverTemplate,
      });

      await tour.start();

      // Cache Step1's stages
      const step1Cache = [...state.cachedStages()];
      expect(step1Cache[0].padding).toBe(8);
      expect(step1Cache[0].radius).toBe(4);

      // Configure Step1 to return empty array on next call
      shouldReturnEmpty = true;

      // Navigate to Step2
      // The transition will try to get fromStages from currentStages
      // If currentStages function returns empty array, it should use cache
      // @ts-expect-error Trigger next
      await tour.handelNext();

      // Should successfully transition to Step2 with its own stages
      const step2Cache = [...state.cachedStages()];
      expect(step2Cache[0].padding).toBe(12);
      expect(step2Cache[0].radius).toBe(6);
    });

    it('should preserve cached stages attributes after multiple resizes', async () => {
      const state = useGlobalState();

      const tour = new Tour({
        steps: [
          {
            element: () => document.getElementById('step1')!,
            stages: () => {
              const rect = document.getElementById('step1')!.getBoundingClientRect();
              return [{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }];
            },
            overlayPadding: 8,
            overlayRadius: 4,
          },
        ],
        popoverTemplate: mockPopoverTemplate,
      });

      await tour.start();

      // Initial cache
      const initialCache = [...state.cachedStages()];
      expect(initialCache[0].padding).toBe(8);
      expect(initialCache[0].radius).toBe(4);
      const firstX = initialCache[0].x;
      const firstY = initialCache[0].y;

      // Trigger resize multiple times
      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(new Event('resize'));

        await vi.waitFor(() => {
          // After resize, padding and radius should be preserved
          const cache = [...state.cachedStages()];
          expect(cache[0].padding).toBe(8);
          expect(cache[0].radius).toBe(4);
        });
      }

      // Final verification - padding/radius should still be correct
      const finalCache = [...state.cachedStages()];
      expect(finalCache[0].padding).toBe(8);
      expect(finalCache[0].radius).toBe(4);

      // Position may or may not change depending on implementation
      // but padding and radius must be preserved
      expect(finalCache[0].x).toBe(firstX);
      expect(finalCache[0].y).toBe(firstY);
    });
  });
});
