import type { signal } from 'alien-signals';
import { effectScope } from 'alien-signals';

export async function waitForAllAnimations(timeout = 2000): Promise<void> {
  return new Promise<void>((resolve) => {
    const startTime = Date.now();
    function checkAnimations(): void {
      // timeout
      if (Date.now() - startTime > timeout) {
        resolve();
        return;
      }

      const animations = document.getAnimations();

      const runningAnimations = animations.filter(
        animation => (
          // @ts-expect-error chrome only
          animation?.animationName
          && animation.playState === 'running'),
      );

      if (runningAnimations.length === 0) {
        resolve();
      }
      else {
        requestAnimationFrame(checkAnimations);
      }
    };

    // ensure animations has started
    setTimeout(() => {
      requestAnimationFrame(checkAnimations);
    }, /** 2 frames */32);
  });
}

/**
 * Any function
 */
// eslint-disable-next-line ts/no-explicit-any
export type AnyFn = (...args: any[]) => any;

export type CreateGlobalStateReturn<Fn extends AnyFn = AnyFn> = Fn;

export function createGlobalState<Fn extends AnyFn>(
  stateFactory: Fn,
): Fn {
  let initialized = false;
  let state: unknown;
  let cleanup: (() => void);

  return ((...args: any[]) => {
    if (!initialized) {
      // effectScope(fn) 会执行 fn 并返回一个 cleanup 函数
      cleanup = effectScope(() => {
        state = stateFactory(...args);
      });
      initialized = true;
    }
    return state;
  }) as Fn;
}

export type MaybeRefOrGetter<T> = T | (() => T);

export function toValue<T>(value: MaybeRefOrGetter<T>): T {
  return typeof value === 'function'
    ? (value as () => T)()
    : value;
}

export type Signal<T> = ReturnType<typeof signal<T>>;
export type MaybeSignal<T> = T | Signal<T>;

export function unsignal<T>(value: MaybeSignal<T>): T {
  return typeof value === 'function'
    ? (value as () => T)()
    : value;
}
