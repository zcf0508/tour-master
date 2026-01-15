import { createDriverjsPopover, getDriverjsArrowPositioned, Tour } from '../../../src';

export default function (): Tour<{ message: string, title?: string }> {
  const step21 = document.getElementById('step_2_1')!;
  const step22 = document.getElementById('step_2_2')!;

  return new Tour<{
    message: string
    title?: string
  }>({
    steps: [
      {
        element: step21,
        stages: () => {
          const rect = step21.getBoundingClientRect();
          return [{
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          }];
        },
        title: 'Step 1 Title',
        message: 'This is the first step of the tour using the new driver.js theme.',
      },
      {
        element: step22,
        stages: () => {
          const rect = step22.getBoundingClientRect();
          return [{
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          }];
        },
        title: 'Step 2 Title',
        message: 'This is the second step. Notice the styling matches driver.js default theme.',
        hideOverlay: true,
      },
    ],
    lockScroll: true,
    popoverTemplate: createDriverjsPopover({
      classPrefix: 'driverjs-theme',
      showProgress: true,
    }),
    popoverArrowPositioned: getDriverjsArrowPositioned(),
  });
}
