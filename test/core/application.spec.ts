import type { MaybeRefOrGetter } from '@vue/reactivity';
import type { HookCallback } from 'hookable';
import type { Tour } from '../../src/core/logic';
import { Hookable } from 'hookable';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TourScheduler } from '../../src/core/application';

describe('tourScheduler', () => {
  // 模拟 Tour 类
  // @ts-expect-error mock `Tour`
  class MockTour extends Hookable<{
    start: HookCallback
    finish: HookCallback
  }> implements Tour<undefined> {
    public start = vi.fn().mockResolvedValue(undefined);
    public stop = vi.fn().mockResolvedValue(undefined);

    constructor() {
      super();
    }
  }

  let mockTour: MockTour;
  let scheduler: TourScheduler;
  let stateHandler: ReturnType<typeof vi.fn<() => Promise<string | undefined>>>;

  beforeEach(() => {
    mockTour = new MockTour();
    stateHandler = vi.fn().mockResolvedValue('test-tour');
  });

  it('应该只有在 startTour 获取到 nextTour 之后才实例化 Tour', async () => {
    // 创建一个 spy 来监控 Tour 实例的创建
    const tourSpy = vi.fn().mockReturnValue(mockTour);

    // 创建 TourScheduler 实例，但不立即实例化 Tour
    scheduler = new TourScheduler({
      tours: [['test-tour', tourSpy]],
      stateHandler,
    });

    // 验证 Tour 还没有被实例化
    expect(tourSpy).not.toHaveBeenCalled();

    // 调用 startTour 方法
    await scheduler.startTour();

    // 验证 stateHandler 被调用
    expect(stateHandler).toHaveBeenCalled();

    // 验证 Tour 被实例化了
    expect(tourSpy).toHaveBeenCalled();

    // 验证 start 方法被调用
    expect(mockTour.start).toHaveBeenCalled();
  });

  it('当 stateHandler 返回 undefined 时不应该实例化 Tour', async () => {
    // 修改 stateHandler 返回 undefined
    stateHandler = vi.fn().mockResolvedValue(undefined);

    const tourSpy = vi.fn().mockReturnValue(mockTour);

    scheduler = new TourScheduler({
      tours: [['test-tour', tourSpy]],
      stateHandler,
    });

    await scheduler.startTour();

    // 验证 stateHandler 被调用
    expect(stateHandler).toHaveBeenCalled();

    // 验证 Tour 没有被实例化
    expect(tourSpy).not.toHaveBeenCalled();

    // 验证 start 方法没有被调用
    expect(mockTour.start).not.toHaveBeenCalled();
  });

  it('当 nextTourName 不存在于 tours 中时不应该实例化 Tour', async () => {
    // 修改 stateHandler 返回一个不存在的 tour 名称
    stateHandler = vi.fn().mockResolvedValue('non-existent-tour');

    const tourSpy = vi.fn().mockReturnValue(mockTour);

    scheduler = new TourScheduler({
      tours: [['test-tour', tourSpy]],
      stateHandler,
    });

    await scheduler.startTour();

    // 验证 stateHandler 被调用
    expect(stateHandler).toHaveBeenCalled();

    // 验证 Tour 没有被实例化
    expect(tourSpy).not.toHaveBeenCalled();

    // 验证 start 方法没有被调用
    expect(mockTour.start).not.toHaveBeenCalled();
  });

  it('当 currentTourName 存在时不应该启动新的 tour', async () => {
    const tourSpy = vi.fn().mockReturnValue(mockTour);

    scheduler = new TourScheduler({
      tours: [['test-tour', tourSpy]],
      stateHandler,
    });

    // 首次启动 tour
    await scheduler.startTour();

    // 验证第一次调用成功
    expect(stateHandler).toHaveBeenCalledTimes(1);
    expect(tourSpy).toHaveBeenCalledTimes(1);
    expect(mockTour.start).toHaveBeenCalledTimes(1);

    // 尝试再次启动 tour
    await scheduler.startTour();

    // 验证没有任何方法被调用
    expect(stateHandler).toHaveBeenCalledTimes(1);
    expect(tourSpy).toHaveBeenCalledTimes(1);
    expect(mockTour.start).toHaveBeenCalledTimes(1);

    // @ts-expect-error _tourInstances is not public
    await scheduler._tourInstances.get('test-tour')?.callHook('finish');

    // 尝试再次启动 tour
    await scheduler.startTour();

    // 验证没有任何方法被调用
    expect(stateHandler).toHaveBeenCalledTimes(2);
    expect(tourSpy).toHaveBeenCalledTimes(2);
    expect(mockTour.start).toHaveBeenCalledTimes(2);
  });
});
