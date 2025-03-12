import type { Ref } from '@vue/reactivity';
import { ref } from '@vue/reactivity';
import { describe, expect, it } from 'vitest';
import { createContext } from '../../src/core/application/context';

describe('createContext', () => {
  it('应该创建一个空的上下文对象当没有提供初始值时', () => {
    const context = createContext();
    expect(context.get('anyKey' as never)).toBeUndefined();
  });

  it('应该使用提供的初始上下文', () => {
    interface TestContext {
      testKey: string
      numberValue: number
    }

    const initialContext: TestContext = {
      testKey: 'testValue',
      numberValue: 42,
    };

    const context = createContext<TestContext>(initialContext);

    expect(context.get('testKey')).toBe('testValue');
    expect(context.get('numberValue')).toBe(42);
  });

  it('应该能够设置和获取上下文值', () => {
    interface TestContext {
      testKey: string
      numberValue: number
    }

    const context = createContext<TestContext>();

    context.set('testKey', 'newValue');
    context.set('numberValue', 100);

    expect(context.get('testKey')).toBe('newValue');
    expect(context.get('numberValue')).toBe(100);
  });

  it('应该返回一个清理函数用于移除特定的值', () => {
    interface TestContext {
      testKey: string
    }

    const context = createContext<TestContext>();

    const cleanup = context.set('testKey', 'someValue');
    expect(context.get('testKey')).toBe('someValue');

    cleanup();
    expect(context.get('testKey')).toBeUndefined();
  });

  it('应该能够清理特定的键', () => {
    interface TestContext {
      key1: string
      key2: string
    }

    const context = createContext<TestContext>({
      key1: 'value1',
      key2: 'value2',
    });

    expect(context.get('key1')).toBe('value1');
    expect(context.get('key2')).toBe('value2');

    context.cleanup('key1');

    expect(context.get('key1')).toBeUndefined();
    expect(context.get('key2')).toBe('value2');
  });

  it('应该能够清理整个上下文', () => {
    interface TestContext {
      key1: string
      key2: string
    }

    const context = createContext<TestContext>({
      key1: 'value1',
      key2: 'value2',
    });

    expect(context.get('key1')).toBe('value1');
    expect(context.get('key2')).toBe('value2');

    context.cleanup();

    expect(context.get('key1')).toBeUndefined();
    expect(context.get('key2')).toBeUndefined();
  });

  it('应该正确处理复杂对象类型', () => {
    interface ComplexContext {
      user: Ref<{ name: string, age: number }>
      settings: { theme: string, notifications: boolean }
    }

    const context = createContext<ComplexContext>();

    const user = ref({ name: '张三', age: 30 });
    const settings = { theme: 'dark', notifications: true };

    context.set('user', user);
    context.set('settings', settings);

    expect(context.get('user') === user).toBe(true);
    expect(context.get('settings')).toEqual(settings);

    user.value.age = 31;
    expect(context.get('user')?.value.age).toBe(31);
  });

  it('应该能够更新已存在的值', () => {
    interface TestContext {
      counter: number
    }

    const context = createContext<TestContext>({ counter: 0 });

    expect(context.get('counter')).toBe(0);

    context.set('counter', 1);
    expect(context.get('counter')).toBe(1);

    context.set('counter', 2);
    expect(context.get('counter')).toBe(2);
  });
});
