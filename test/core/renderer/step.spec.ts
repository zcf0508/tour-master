import type { StageDefinition } from '../../../src/core/renderer/overlay';
import type { showPopover } from '../../../src/core/renderer/popover';
import type { Signal } from '../../../src/utils';
import { signal } from 'alien-signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showStep } from '../../../src';

let store = {
  overlayDom: signal<SVGSVGElement>(),
  currentStages: signal<StageDefinition[] | (() => StageDefinition[])>(),
  popoverContext: signal<ReturnType<typeof showPopover>>(),
};

const mockUseGlobalState = vi.hoisted(() => vi.fn());

vi.mock('../../../src/store', () => ({
  useGlobalState: mockUseGlobalState,
}));

const mockShowPopover = vi.hoisted(() => vi.fn());

vi.mock('../../../src/core/renderer/popover', () => ({
  showPopover: mockShowPopover,
}));

const mockCreateOverlaySvg = vi.hoisted(() => vi.fn());
const mockTransitionStage = vi.hoisted(() => vi.fn());

vi.mock('../../../src/core/renderer/overlay', async () => {
  const actual = await vi.importActual('../../../src/core/renderer/overlay');
  return {
    ...actual,
    refreshOverlay: vi.fn(),
    createOverlaySvg: mockCreateOverlaySvg,
    transitionStage: mockTransitionStage,
  };
});

describe('step', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.restoreAllMocks();
    vi.useRealTimers();

    store = {
      overlayDom: signal<SVGSVGElement>(),
      currentStages: signal<StageDefinition[] | (() => StageDefinition[])>(),
      popoverContext: signal<ReturnType<typeof showPopover>>(),
    };

    mockUseGlobalState.mockReturnValue(store);

    // 清理DOM
    document.body.innerHTML = '';
  });

  it('应该正确创建popover和overlay', async () => {
    // 模拟DOM元素
    const mockPopoverEl = document.createElement('div');
    mockPopoverEl.id = 'test-popover';

    // 模拟stages
    const stages = [
      {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      },
    ];

    // 设置模拟函数的返回值
    const mockDestoryPopover = vi.fn();
    mockShowPopover.mockReturnValue([mockPopoverEl, mockDestoryPopover]);

    // 模拟createOverlaySvg函数
    const mockOverlaySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;

    mockCreateOverlaySvg.mockReturnValue(mockOverlaySvg);

    const createPopoverEl = (): HTMLDivElement => mockPopoverEl;

    // 调用showStep
    const [destroyOverlay, destroyPopover] = await showStep(
      createPopoverEl,
      undefined,
      stages,
    );

    // 验证结果
    const state = mockUseGlobalState();
    expect(state.popoverContext()).toBeDefined();
    expect(state.popoverContext()?.[0]).toBe(mockPopoverEl);
    expect(state.overlayDom()).toBe(mockOverlaySvg);
    expect(mockShowPopover).toHaveBeenCalled();
    expect(mockCreateOverlaySvg).toHaveBeenCalledWith(
      stages,
      expect.objectContaining({
        stagePadding: 4,
        stageRadius: 4,
        zIndex: 10000,
      }),
    );

    // 测试销毁函数
    destroyOverlay();
    expect(state.overlayDom()).toBeUndefined();

    destroyPopover();
    expect(mockShowPopover).toHaveBeenCalled();
  });

  it('应该使用自定义选项创建popover和overlay', async () => {
    // 模拟DOM元素
    const mockPopoverEl = document.createElement('div');
    const mockArrowEl = document.createElement('div');

    // 模拟stages
    const stages = [
      {
        x: 30,
        y: 40,
        width: 200,
        height: 100,
      },
    ];

    // 设置模拟函数的返回值
    mockShowPopover.mockReturnValue([mockPopoverEl, vi.fn()]);

    // 模拟createOverlaySvg函数
    const mockOverlaySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;

    mockCreateOverlaySvg.mockReturnValue(mockOverlaySvg);

    const createPopoverEl = (): HTMLDivElement => mockPopoverEl;
    // 使用ref创建arrowElRef
    const mockArrowElRef = { value: mockArrowEl } as unknown as Signal<HTMLElement | undefined>;
    const mockPopoverArrowPositioned = vi.fn();

    // 调用showStep，使用自定义选项
    await showStep(
      createPopoverEl,
      undefined,
      stages,
      {
        arrowElRef: mockArrowElRef,
        popoverArrowPositioned: mockPopoverArrowPositioned,
        popoverPadding: 10,
        popoverOffset: 5,
        overlayOpacity: 0.5,
        placement: 'top',
        zIndex: 5000,
      },
    );

    // 验证结果
    expect(mockShowPopover).toHaveBeenCalledWith(
      expect.anything(),
      createPopoverEl,
      expect.objectContaining({
        arrowElRef: mockArrowElRef,
        popoverArrowPositioned: mockPopoverArrowPositioned,
        popoverPadding: 10,
        popoverOffset: 5,
        placement: 'top',
        zIndex: 5001,
      }),
    );

    expect(mockCreateOverlaySvg).toHaveBeenCalledWith(
      stages,
      expect.objectContaining({
        stagePadding: 4,
        stageRadius: 4,
        zIndex: 5000,
        overlayOpacity: 0.5,
      }),
    );
  });

  it('应该在hideOverlay为true时不创建overlay', async () => {
    // 模拟DOM元素
    const mockPopoverEl = document.createElement('div');

    // 模拟stages
    const stages = [
      {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      },
    ];

    // 设置模拟函数的返回值
    mockShowPopover.mockReturnValue([mockPopoverEl, vi.fn()]);

    const createPopoverEl = (): HTMLDivElement => mockPopoverEl;

    // 设置初始overlay
    const state = mockUseGlobalState();
    const initialOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    state.overlayDom(initialOverlay);

    // 模拟remove方法
    const removeMock = vi.fn();
    initialOverlay.remove = removeMock;

    // 调用showStep，hideOverlay为true
    await showStep(
      createPopoverEl,
      undefined,
      stages,
      {
        hideOverlay: true,
      },
    );

    // 验证结果
    expect(removeMock).toHaveBeenCalled();
    expect(state.overlayDom()).toBeUndefined();
    expect(mockCreateOverlaySvg).not.toHaveBeenCalled();
    expect(mockShowPopover).toHaveBeenCalled();
  });

  it('应该在存在overlay时使用transitionStage', async () => {
    // 模拟DOM元素
    const mockPopoverEl = document.createElement('div');

    // 模拟stages
    const stages = [
      {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      },
    ];

    // 设置模拟函数的返回值
    mockShowPopover.mockReturnValue([mockPopoverEl, vi.fn()]);

    const createPopoverEl = (): HTMLDivElement => mockPopoverEl;

    // 设置初始overlay
    const state = mockUseGlobalState();
    state.overlayDom(document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement);

    // 调用showStep
    await showStep(
      createPopoverEl,
      undefined,
      stages,
    );

    // 验证结果
    expect(mockCreateOverlaySvg).not.toHaveBeenCalled();
    expect(mockTransitionStage).toHaveBeenCalledWith(
      stages,
      expect.objectContaining({
        stagePadding: 4,
        stageRadius: 4,
      }),
    );
  });

  it('应该在有现有popoverContext时调用销毁函数', async () => {
    // 模拟DOM元素
    const mockPopoverEl = document.createElement('div');

    // 模拟stages
    const stages = [
      {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      },
    ];

    // 设置模拟函数的返回值
    mockShowPopover.mockReturnValue([mockPopoverEl, vi.fn()]);

    // 模拟createOverlaySvg函数
    const mockOverlaySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;

    mockCreateOverlaySvg.mockReturnValue(mockOverlaySvg);

    // 设置初始popoverContext
    const state = mockUseGlobalState();
    const destroyPrevPopover = vi.fn();
    state.popoverContext([document.createElement('div'), destroyPrevPopover]);

    const createPopoverEl = (): HTMLDivElement => mockPopoverEl;

    // 调用showStep
    await showStep(
      createPopoverEl,
      undefined,
      stages,
    );

    // 验证结果
    expect(destroyPrevPopover).toHaveBeenCalled();
  });
});
