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

    expect(overlaySvg.innerHTML).toMatchInlineSnapshot('"<path d="M1024,0L0,0L0,768L1024,768L1024,0ZM0,0 h100 a0,0 0 0 1 0,0 v100 a0,0 0 0 1 -0,0 h-100 a0,0 0 0 1 -0,-0 v-100 a0,0 0 0 1 0,-0 z" style="fill: rgb(0,0,0); opacity: 0.7; pointer-events: auto; cursor: auto;"></path>"');

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

    expect(overlaySvg.innerHTML).toMatchInlineSnapshot('"<path d="M1024,0L0,0L0,768L1024,768L1024,0ZM0,0 h100 a0,0 0 0 1 0,0 v100 a0,0 0 0 1 -0,0 h-100 a0,0 0 0 1 -0,-0 v-100 a0,0 0 0 1 0,-0 zM100,100 h100 a0,0 0 0 1 0,0 v100 a0,0 0 0 1 -0,0 h-100 a0,0 0 0 1 -0,-0 v-100 a0,0 0 0 1 0,-0 z" style="fill: rgb(0,0,0); opacity: 0.7; pointer-events: auto; cursor: auto;"></path>"');
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

    expect(overlaySvg.innerHTML).toMatchInlineSnapshot('"<path d="M200,0L0,0L0,300L200,300L200,0ZM0,0 h100 a0,0 0 0 1 0,0 v100 a0,0 0 0 1 -0,0 h-100 a0,0 0 0 1 -0,-0 v-100 a0,0 0 0 1 0,-0 z" style="fill: rgb(0,0,0); opacity: 0.7; pointer-events: auto; cursor: auto;"></path>"');

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

    expect(overlaySvg.innerHTML).toMatchInlineSnapshot('"<path d="M200,0L0,0L0,300L200,300L200,0ZM20,26 h100 a4,4 0 0 1 4,4 v100 a4,4 0 0 1 -4,4 h-100 a4,4 0 0 1 -4,-4 v-100 a4,4 0 0 1 4,-4 zM60,76 h20 a4,4 0 0 1 4,4 v30 a4,4 0 0 1 -4,4 h-20 a4,4 0 0 1 -4,-4 v-30 a4,4 0 0 1 4,-4 z" style="fill: rgb(0,0,0); opacity: 0.7; pointer-events: auto; cursor: auto;"></path>"');

    // Cleanup
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});
