import { toValue } from '@vue/reactivity';
import { tourScheduler } from '..';
import { Tour } from '../../../src';

export default function (): Tour<{ message: string | (() => string) }> {
  const step11 = document.getElementById('step_1_1')!;
  const step12 = document.getElementById('step_1_2')!;

  return new Tour<{ message: string | (() => string) }>(
    {
      steps: [
        {
          element: step11,
          message: 'This tooltip is for step 1',
          leave() {
            const { get, set } = tourScheduler.context;
            const globalMessage = get('globalMessage');

            if (globalMessage !== undefined) {
              set('globalMessage', globalMessage + 1);
            }
            else {
              set('globalMessage', 1);
            }
          },
        },
        {
          stages: () => {
            const rect = step12.getBoundingClientRect();
            return [{
              x: rect.x,
              y: rect.y,
              width: rect.width + 20,
              height: rect.height,
            }];
          },
          message: () => {
            const { get } = tourScheduler.context;
            const globalMessage = get('globalMessage');

            return `This tooltip is for step 2\nglobalMessage: ${
              globalMessage
            }`;
          },
          placement: 'right',
        },
      ],
      popoverTemplate: (pre, next, finish, currentStep, currentStepIndex) => {
        return (bindArrowEl) => {
          const tooltipEl = document.createElement('div') as HTMLElement;
          tooltipEl.innerHTML = `<div id="arrow" style="position: absolute"></div>
  <div>
    <div style="white-space: pre-line">${toValue(currentStep.message)}</div>
    <div>
      <button class="tooltip-btn" data-action="pre">Pre</button>
      <button class="tooltip-btn" data-action="next">Next</button>
      <button class="tooltip-btn" data-action="finish">Finish</button>
    </div>
  </div>`;

          // Add event listeners after creating the buttons
          const buttons = tooltipEl.querySelectorAll('.tooltip-btn');
          Array.from(buttons).forEach((button, index) => {
            if (currentStepIndex === 0 && index === 0) {
              button.setAttribute('disabled', 'true');
            }
            button.addEventListener('click', (e) => {
              const action = (e.target as HTMLElement).dataset.action;
              switch (action) {
                case 'pre':
                  pre();
                  break;
                case 'next':
                  next();
                  break;
                case 'finish':
                  finish();
                  break;
              }
            });
          });

          Object.assign(tooltipEl.style, {
            'position': 'absolute',
            'background': '#fff',
            'z-index': 10001,
            'padding': '4px',
            'border-radius': '4px',
          });

          document.body.appendChild(tooltipEl);

          const arrowEl = tooltipEl.querySelector('#arrow')! as HTMLElement;

          Object.assign(arrowEl.style, {
            background: '#fff',
            width: '8px',
            height: '8px',
            transform: 'rotate(45deg)',
          });

          bindArrowEl(arrowEl);

          return tooltipEl;
        };
      },
      popoverArrowPositioned: (arrowEl, placement, arrowData) => {
        const { x: arrowX, y: arrowY } = arrowData;

        const staticSide = {
          top: 'bottom',
          right: 'left',
          bottom: 'top',
          left: 'right',
        }[placement.split('-')[0]]!;

        Object.assign(arrowEl.style, {
          left: arrowX != null
            ? `${arrowX}px`
            : '',
          top: arrowY != null
            ? `${arrowY}px`
            : '',
          right: '',
          bottom: '',
          [staticSide]: '-4px',
        });
      },
      popoverOffset: 16,
      zIndex: 200,
      overlayOpacity: 0.75,
      onFinish() {
        localStorage.setItem('showTour1', 'false');
        tourScheduler.context.cleanup('globalMessage');
      },
    },
  );
}
