# Tour Master

[![NPM version](https://img.shields.io/npm/v/tour-master?color=a1b858&label=)](https://www.npmjs.com/package/tour-master)

A flexible and customizable tour guide library for web applications.

## Features

- Support for multiple sequential tours
- Customizable popover templates and styling
- Configurable step navigation and positioning
- TypeScript support

## Installation

```bash
npm install tour-master
```

## Basic Usage

```typescript
import { Tour } from 'tour-master';

// Create tour instances
const tour = new Tour<{ message: string }>({
  steps: [
    {
      element: document.getElementById('step1'),
      message: 'This is step 1',
    },
    {
      element: document.getElementById('step2'),
      message: 'This is step 2',
    },
  ],
});

tour.start();
```

## Tour Configuration

### Step Options

```typescript
interface TourStep {
  element: string | HTMLElement | (() => HTMLElement)
  entry?: (action: 'pre' | 'next') => void | Promise<void>
  leave?: (action: 'pre' | 'next' | 'finish') => void | Promise<void>
  placement?: Placement
}
```

### Custom Popover Template

#### Vanilla JS
```typescript
popoverTemplate: (pre, next, finish, currentStep, currentStepIndex, stepTotal) => {
  return () => {
    const popoverEl = document.createElement('div');
    popoverEl.innerHTML = `
      <div>${currentStep.message}</div>
      <div>
        <button data-action="pre">Previous</button>
        <button data-action="next">Next</button>
        <button data-action="finish">Finish</button>
      </div>
    `;

    document.body.appendChild(popoverEl);

    return popoverEl;
  };
};
```

#### vue
```typescript
import { defineComponent, h, render } from 'vue';

popoverTemplate: (pre, next, finish, currentStep, currentStepIndex, stepTotal) => {
  return () => {
    const popoverComponent = defineComponent({
      render() {
        return h('div', [
          h('div', currentStep.message),
          h('div', [
            h('button', { onClick: pre }, 'Previous'),
            h('button', { onClick: next }, 'Next'),
            h('button', { onClick: finish }, 'Finish'),
          ]),
        ]);
      },
    });

    const popoverElContainer = document.createElement('div');
    render(popoverComponent, popoverElContainer);

    const popoverEl = popoverElContainer.children[0] as HTMLElement;
    document.body.appendChild(popoverEl);

    return popoverEl;
  };
};
```

## Multiple Tours

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
