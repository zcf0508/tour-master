import { createOverlaySvg } from '../../src/core/renderer/overlay';
import { showPopover } from '../../src/core/renderer/popover';

const referenceEl = document.getElementById('step_1');

const referenceElRect = referenceEl!.getBoundingClientRect();

const overlaySvg = createOverlaySvg(
  [
    {
      x: referenceElRect.left,
      y: referenceElRect.top,
      width: referenceElRect.width,
      height: referenceElRect.height,
    },
  ],
  {
    stagePadding: 4,
    stageRadius: 4,
  },
);

document.body.appendChild(overlaySvg);

showPopover(
  referenceEl!,
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
);
