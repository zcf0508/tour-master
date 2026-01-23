import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOverlaySvg, transitionStage } from '../../../src/core/renderer/overlay';
import { useGlobalState } from '../../../src/store';
import { toValue } from '../../../src/utils';

describe('overlay', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should create overlay svg', () => {
    const overlaySvg = createOverlaySvg(
      [{
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }],
    );

    expect(overlaySvg.innerHTML).toMatchInlineSnapshot('"<path d="M414,0L0,0L0,896L414,896L414,0ZM0,0 h100 a0,0 0 0 1 0,0 v100 a0,0 0 0 1 -0,0 h-100 a0,0 0 0 1 -0,-0 v-100 a0,0 0 0 1 0,-0 z" style="fill: rgb(0, 0, 0); opacity: 0.7; pointer-events: auto; cursor: auto;"></path>"');

    expect(overlaySvg.style.zIndex).toBe('10000');
  });

  it('zIndex', () => {
    const overlaySvg = createOverlaySvg(
      [{
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }],
      {
        zIndex: 200,
      },
    );

    expect(overlaySvg.style.zIndex).toBe('200');
  });

  it('multiple stages', () => {
    const overlaySvg = createOverlaySvg(
      [
        {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        {
          x: 100,
          y: 100,
          width: 100,
          height: 100,
        },
      ],
    );

    expect(overlaySvg.innerHTML).toMatchInlineSnapshot('"<path d="M414,0L0,0L0,896L414,896L414,0ZM0,0 h100 a0,0 0 0 1 0,0 v100 a0,0 0 0 1 -0,0 h-100 a0,0 0 0 1 -0,-0 v-100 a0,0 0 0 1 0,-0 zM100,100 h100 a0,0 0 0 1 0,0 v100 a0,0 0 0 1 -0,0 h-100 a0,0 0 0 1 -0,-0 v-100 a0,0 0 0 1 0,-0 z" style="fill: rgb(0, 0, 0); opacity: 0.7; pointer-events: auto; cursor: auto;"></path>"');
  });

  it('global state', () => {
    const state = useGlobalState();

    const test1Stage = [{
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }];

    createOverlaySvg(test1Stage);

    expect(toValue(state.currentStages())).toEqual([{
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      padding: 0,
      radius: 0,
    }]);

    // ---

    const test2Stage = [{
      x: 20,
      y: 30,
      width: 100,
      height: 100,
    }];

    createOverlaySvg(test2Stage, {
      stagePadding: 4,
      stageRadius: 4,
    });

    expect(toValue(state.currentStages())).toEqual([{
      x: 20,
      y: 30,
      width: 100,
      height: 100,
      padding: 4,
      radius: 4,
    }]);
  });

  it('window resize', () => {
    const state = useGlobalState();

    const overlaySvg = createOverlaySvg(
      [{
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }],
    );

    document.body.appendChild(overlaySvg);

    state.overlayDom(overlaySvg);

    expect(overlaySvg.getAttribute('viewBox')).toBe(`0 0 ${window.innerWidth} ${window.innerHeight}`);

    window.innerWidth = 200;
    window.innerHeight = 300;
    window.dispatchEvent(new Event('resize'));

    expect(overlaySvg.getAttribute('viewBox')).toBe('0 0 200 300');
  });

  it('transitionStage', async () => {
    const state = useGlobalState();

    const overlaySvg = createOverlaySvg(
      [{
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }],
    );

    document.body.appendChild(overlaySvg);

    state.overlayDom(overlaySvg);

    expect(overlaySvg.innerHTML).toMatchInlineSnapshot('"<path d="M200,0L0,0L0,300L200,300L200,0ZM0,0 h100 a0,0 0 0 1 0,0 v100 a0,0 0 0 1 -0,0 h-100 a0,0 0 0 1 -0,-0 v-100 a0,0 0 0 1 0,-0 z" style="fill: rgb(0, 0, 0); opacity: 0.7; pointer-events: auto; cursor: auto;"></path>"');

    // ---

    // Setup fake timers
    vi.useFakeTimers();

    // Mock performance.now()
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);

    const rafMock = vi.fn();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafMock(cb);
      return 1;
    });

    state.currentStages([{
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }]);

    // Start transition
    const transitionPromise = transitionStage(
      [
        {
          x: 20,
          y: 30,
          width: 100,
          height: 100,
        },
        {
          x: 60,
          y: 80,
          width: 20,
          height: 30,
        },
      ],
      {
        stagePadding: 4,
        stageRadius: 4,
      },
    );

    // Simulate animation frames
    rafMock.mock.calls.forEach(([cb]) => {
      now += 16; // Simulate ~60fps
      cb(now);
    });

    // Fast-forward to end of animation
    now = 300; // Animation duration
    rafMock.mock.lastCall![0](now);

    await transitionPromise;

    expect(overlaySvg.innerHTML).toMatchInlineSnapshot('"<path d="M200,0L0,0L0,300L200,300L200,0ZM20,26 h100 a4,4 0 0 1 4,4 v100 a4,4 0 0 1 -4,4 h-100 a4,4 0 0 1 -4,-4 v-100 a4,4 0 0 1 4,-4 zM60,76 h20 a4,4 0 0 1 4,4 v30 a4,4 0 0 1 -4,4 h-20 a4,4 0 0 1 -4,-4 v-30 a4,4 0 0 1 4,-4 z" style="fill: rgb(0, 0, 0); opacity: 0.7; pointer-events: auto; cursor: auto;"></path>"');

    // Cleanup
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should use cached stages when function throws error', () => {
    const state = useGlobalState();

    // Initialize with valid stages
    createOverlaySvg([{
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }]);

    // Verify cache is updated
    expect(state.cachedStages()).toEqual([{
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      padding: 0,
      radius: 0,
    }]);

    // Create overlay with function that throws error (simulating destroyed element)
    const overlaySvg2 = createOverlaySvg(
      () => {
        throw new Error('Element not found');
      },
      {
        stagePadding: 10,
        stageRadius: 10,
      },
    );

    // Should use cached stages instead of throwing
    expect(overlaySvg2.innerHTML).toContain('h100 a0,0'); // Dimensions from cached value
    expect(state.cachedStages()).toEqual([{
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      padding: 0,
      radius: 0,
    }]);
  });

  it('should use cached stages when function returns empty array', () => {
    const state = useGlobalState();

    // Initialize with valid stages and custom padding/radius
    createOverlaySvg([{
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    }], {
      stagePadding: 5,
      stageRadius: 3,
    });

    // Cache should be updated with processed stages
    expect(state.cachedStages()).toEqual([{
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      padding: 5,
      radius: 3,
    }]);

    // Create overlay with function that returns empty array
    const overlaySvg2 = createOverlaySvg(
      () => [],
      {
        stagePadding: 10,
        stageRadius: 10,
      },
    );

    // Should use cached stages (with original padding/radius)
    // width: 200, padding: 5, radius: 3 => h(200+5*2-3*2) = h204
    expect(overlaySvg2.innerHTML).toContain('h204 a3,3'); // From cache
    expect(state.cachedStages()).toEqual([{
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      padding: 5,
      radius: 3,
    }]);
  });

  it('resolveStages - should update cache with successful result', () => {
    const state = useGlobalState();

    // Create initial overlay
    createOverlaySvg([{
      x: 10,
      y: 20,
      width: 150,
      height: 150,
    }]);

    // Create another overlay with valid new stages
    createOverlaySvg([{
      x: 30,
      y: 40,
      width: 250,
      height: 250,
    }], {
      stagePadding: 8,
      stageRadius: 6,
    });

    // Cache should be updated with new stages
    expect(state.cachedStages()).toEqual([{
      x: 30,
      y: 40,
      width: 250,
      height: 250,
      padding: 8,
      radius: 6,
    }]);
  });

  it('transitionStage should handle errors gracefully', async () => {
    const state = useGlobalState();

    // Initialize overlay and cache
    const overlaySvg = createOverlaySvg([{
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }]);

    document.body.appendChild(overlaySvg);
    state.overlayDom(overlaySvg);

    // Mock requestAnimationFrame to simulate animation
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    // Mock performance.now()
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);

    // Start transition with function that will throw error
    const transitionPromise = transitionStage(
      () => {
        throw new Error('Element destroyed during animation');
      },
      {
        stagePadding: 10,
        stageRadius: 5,
      },
    );

    // Simulate animation frames (should use cached value and complete)
    // Execute first frame
    expect(rafCallbacks.length).toBeGreaterThan(0);
    now = 16;
    rafCallbacks[0](now);

    // Execute second frame
    if (rafCallbacks.length > 1) {
      now = 32;
      rafCallbacks[1](now);
    }

    // Execute final frame to complete animation
    const lastIndex = rafCallbacks.length - 1;
    now = 300;
    rafCallbacks[lastIndex](now);

    await transitionPromise;

    // Should use cached stages and not throw
    expect(state.cachedStages()).toEqual([{
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      padding: 0,
      radius: 0,
    }]);

    // Cleanup
    vi.restoreAllMocks();
  });
});
