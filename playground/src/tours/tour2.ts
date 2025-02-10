import { Tour } from '../../../src';

export default function (): Tour<{ message: string }> {
  const step21 = document.getElementById('step_2_1')!;
  const step22 = document.getElementById('step_2_2')!;

  return new Tour<{
    message: string
  }>({
    steps: [
      {
        element: step21,
        message: 'This tooltip is for step 1',
      },
      {
        element: step22,
        message: 'This tooltip is for step 2',
      },
    ],
    tooltipTemplate: (pre, next, finish, currentStep, currentStepIndex) => {
      return () => {
        const tooltipEl = document.createElement('div') as HTMLElement;
        tooltipEl.innerHTML = `<div>
    <div>${currentStep.message}</div>
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

        return tooltipEl;
      };
    },
  });
}
