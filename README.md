# Tour Master

[![NPM version](https://img.shields.io/npm/v/tour-master?color=a1b858&label=)](https://www.npmjs.com/package/tour-master)

A flexible and customizable tour guide library for web applications, built with TypeScript and Vue.js reactivity system.

## Features

- 🎯 Highly customizable tour steps and popover templates
- 🎨 Flexible positioning and styling options
- 🔄 Support for entry/leave hooks for each step
- 🎭 Customizable overlay and highlighting
- 📏 Configurable offsets and padding
- 🎯 Multiple placement options
- 💪 Written in TypeScript with full type support

## Installation

```bash
npm install tour-master
```

## Basic Usage

```typescript
import { Tour } from 'tour-master';

const tour = new Tour({
  steps: [
    {
      element: '#step1', // Can be string ID, HTMLElement, or function
      stages: [ // Optional custom highlight areas
        {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      ],
    },
    {
      element: document.getElementById('step2'),
      placement: 'top', // Control popover placement
      entry: async (action) => {
        // Do something when entering this step
      },
      leave: async (action) => {
        // Do something when leaving this step
      },
    },
  ],
  popoverTemplate: ({ pre, next, finish, currentStep, currentStepIndex, stepTotal }) => {
    // Return a function that creates and returns your popover element
    return (bindArrowEl) => {
      const el = document.createElement('div');
      // ... configure your popover
      return el;
    };
  },
  // Optional configurations
  popoverOffset: 8,
  popoverPadding: 5,
  zIndex: 1000,
  overlayOpacity: 0.5,
});

// Start the tour
tour.start();
```

## Configuration Options

### Tour Configuration

```typescript
interface TourConfig<T = undefined> {
  steps: Array<TourStep & T>
  popoverTemplate: PopoverTemplate<T>
  popoverArrowPositioned?: PopoverArrowPositionedHandler
  popoverOffset?: number
  popoverPadding?: number
  zIndex?: number
  overlayOpacity?: number
  arrowPadding?: number
  /**
   * If set, the tour will only show once.
   */
  storageKey?: string
  /**
   * If set, the tour will lock the scroll.
   *
   * @default false
   */
  lockScroll?: boolean
  /** call before start */
  onStart?: (() => void) | (() => Promise<void>)
  /** call after finish */
  onFinish?: (() => void) | (() => Promise<void>)
}
```

### Step Options

```typescript
interface TourStep {
  element?: string | ReferenceElement | (() => ReferenceElement)
  stages?: StageDefinition[] | (() => StageDefinition[])
  entry?: (action: 'pre' | 'next') => void | Promise<void>
  leave?: (action: 'pre' | 'next' | 'finish') => void | Promise<void>
  placement?: Placement
  /** default: false */
  hideOverlay?: boolean
  offset?: number
  padding?: number
  arrowPadding?: number
}
```

### Custom Popover Templates

You can create custom popover templates using vanilla JavaScript or any framework. Here's an example with Vue:

```typescript
import { defineComponent, h, render } from 'vue';

const tour = new Tour({
  // ... other config
  popoverTemplate: ({ pre, next, finish, currentStep, currentStepIndex, stepTotal }) => {
    return (bindArrowEl) => {
      const component = defineComponent({
        setup() {
          return () => h('div', { class: 'tour-popover' }, [
            h('div', { class: 'content' }, currentStep.content),
            h('div', { class: 'actions' }, [
              h('button', { onClick: pre }, 'Previous'),
              h('button', { onClick: next }, 'Next'),
              h('button', { onClick: finish }, 'Finish'),
            ]),
          ]);
        },
      });

      const container = document.createElement('div');
      render(component, container);
      return container.firstElementChild as HTMLElement;
    };
  },
});
```

## Advanced Features

### Custom Stage Definitions

You can define custom highlight areas for each step:

```typescript
const tour = new Tour({
  steps: [
    {
      element: '#step1',
      stages: () => [{
        x: 100,
        y: 100,
        width: 200,
        height: 50,
      }],
    },
  ],
});
```

### Lifecycle Hooks

Each step supports entry and leave hooks:

```typescript
const tour = new Tour({
  steps: [
    {
      element: '#step2',
      entry: async (action) => {
        // action will be 'pre' or 'next'
        await someAsyncOperation();
      },
      leave: async (action) => {
        // action will be 'pre', 'next', or 'finish'
        await cleanup();
      },
    },
  ],
});
```
### Multiple Tours Scheduler

You can chain multiple tours together:

```typescript
const tourScheduler = new TourScheduler({
  tours: new Map([
    ['tour1', tour1],
    ['tour2', tour2],
  ]),
  stateHandler() {
    // Logic to determine which tour to show
    return 'tour1'; // or 'tour2'
  },
});
```

## Examples

Check the `playground` directory in the repository for complete working examples including:

- Multiple sequential tours
- Custom popover styling
- Tour transitions

## License

MIT
