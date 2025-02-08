import { showStep } from '../../src/core/renderer';

const referenceEl = document.getElementById('step_1')!;

referenceEl.addEventListener('click', () => {
  showStep(
    referenceEl,
    () => {
      const tooltipEl = document.createElement('div') as HTMLElement;
      tooltipEl.textContent = 'My tooltip with more content';

      Object.assign(tooltipEl.style, {
        'position': 'absolute',
        'background': '#fff',
        'z-index': 10001,
        'padding': '4px',
        'border-radius': '4px',
      });

      document.body.appendChild(tooltipEl);

      return tooltipEl;
    },
    () => {
      const referenceElRect = referenceEl.getBoundingClientRect();

      return [
        {
          x: referenceElRect.left,
          y: referenceElRect.top,
          width: referenceElRect.width,
          height: referenceElRect.height,
        },
      ];
    },
  );
});
