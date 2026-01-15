import type { PopoverTemplate, TourStep } from '../core/logic';
import { toValue } from '../utils';

export interface DriverjsThemeOptions {
  /**
   * Class prefix to avoid style conflicts
   * @default 'driverjs-theme'
   */
  classPrefix?: string
  /**
   * Text for the previous button
   * @default 'Previous'
   */
  prevBtnText?: string
  /**
   * Text for the next button
   * @default 'Next'
   */
  nextBtnText?: string
  /**
   * Text for the finish button
   * @default 'Done'
   */
  doneBtnText?: string
  /**
   * Whether to show the progress text (e.g. "1 of 5")
   * @default true
   */
  showProgress?: boolean
  /**
   * Custom progress text generator
   */
  progressText?: (current: number, total: number) => string
}

let styleInjected = false;

function injectDriverjsStyles(prefix: string): void {
  if (styleInjected) {
    return;
  }
  styleInjected = true;

  const style = document.createElement('style');
  style.id = `${prefix}-style`;
  style.innerHTML = `
    .${prefix}-popover {
      background-color: #ffffff;
      color: #2d2d2d;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 1px 10px rgba(0,0,0,0.4);
      max-width: 300px;
      min-width: 250px;
      font-family: "Helvetica Neue", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      z-index: 1000000000;
      box-sizing: border-box;
    }

    .${prefix}-popover * {
      box-sizing: border-box;
    }

    .${prefix}-popover-title {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 10px 0;
      line-height: 1.4;
      display: block;
    }

    .${prefix}-popover-description {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 20px 0;
      color: #2d2d2d;
    }

    .${prefix}-popover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }

    .${prefix}-popover-progress-text {
      font-size: 12px;
      color: #666;
    }

    .${prefix}-popover-btn-group {
      display: flex;
      gap: 5px;
      margin-left: auto;
    }

    .${prefix}-popover-btn {
      border: 1px solid #ccc;
      background-color: #fff;
      color: #333;
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      outline: none;
      text-shadow: none;
    }

    .${prefix}-popover-btn:hover {
      background-color: #f0f0f0;
    }

    .${prefix}-popover-btn:disabled {
      color: #999;
      cursor: not-allowed;
      background-color: #f9f9f9;
      border-color: #e0e0e0;
    }

    .${prefix}-popover-btn-primary {
      background-color: #2d2d2d;
      color: #fff;
      border-color: #2d2d2d;
    }

    .${prefix}-popover-btn-primary:hover {
      background-color: #000;
      border-color: #000;
    }

    .${prefix}-popover-arrow {
      width: 10px;
      height: 10px;
      background: #ffffff;
      position: absolute;
      transform: rotate(45deg);
    }
  `;
  document.head.appendChild(style);
}

export function createDriverjsPopover<T extends { title?: string, message: string | (() => string) }>(
  options: DriverjsThemeOptions = {},
): PopoverTemplate<T> {
  const {
    classPrefix = 'driverjs-theme',
    prevBtnText = 'Previous',
    nextBtnText = 'Next',
    doneBtnText = 'Done',
    showProgress = true,
    progressText = (current, total) => `${current} of ${total}`,
  } = options;

  injectDriverjsStyles(classPrefix);

  return ({ pre, next, finish, currentStep, currentStepIndex, stepTotal }) => {
    return (bindArrowEl) => {
      const popoverEl = document.createElement('div');
      popoverEl.classList.add(`${classPrefix}-popover`);

      const messageContent = toValue(currentStep.message);
      const titleContent = currentStep.title
        ? toValue(currentStep.title)
        : '';

      // Structure
      const arrowEl = document.createElement('div');
      arrowEl.classList.add(`${classPrefix}-popover-arrow`);
      popoverEl.appendChild(arrowEl);

      if (titleContent) {
        const titleEl = document.createElement('div');
        titleEl.classList.add(`${classPrefix}-popover-title`);
        titleEl.textContent = titleContent;
        popoverEl.appendChild(titleEl);
      }

      const descEl = document.createElement('div');
      descEl.classList.add(`${classPrefix}-popover-description`);
      // Support HTML content or plain text? Driver.js supports HTML in description
      // Using innerHTML is risky but standard for tour libraries.
      // Let's assume message can be HTML string.
      descEl.innerHTML = messageContent;
      popoverEl.appendChild(descEl);

      const footerEl = document.createElement('footer');
      footerEl.classList.add(`${classPrefix}-popover-footer`);

      if (showProgress) {
        const progressEl = document.createElement('span');
        progressEl.classList.add(`${classPrefix}-popover-progress-text`);
        progressEl.textContent = progressText(currentStepIndex + 1, stepTotal);
        footerEl.appendChild(progressEl);
      }

      const btnGroupEl = document.createElement('div');
      btnGroupEl.classList.add(`${classPrefix}-popover-btn-group`);

      // Previous Button
      if (currentStepIndex > 0) {
        const prevBtn = document.createElement('button');
        prevBtn.classList.add(`${classPrefix}-popover-btn`);
        prevBtn.textContent = prevBtnText;
        prevBtn.addEventListener('click', pre);
        btnGroupEl.appendChild(prevBtn);
      }

      // Next/Finish Button
      const isLast = currentStepIndex === stepTotal - 1;
      const nextBtn = document.createElement('button');
      nextBtn.classList.add(`${classPrefix}-popover-btn`, `${classPrefix}-popover-btn-primary`);
      nextBtn.textContent = isLast
        ? doneBtnText
        : nextBtnText;

      nextBtn.addEventListener('click', () => {
        if (isLast) {
          finish();
        }
        else {
          next();
        }
      });
      btnGroupEl.appendChild(nextBtn);

      footerEl.appendChild(btnGroupEl);
      popoverEl.appendChild(footerEl);

      document.body.appendChild(popoverEl);

      bindArrowEl(arrowEl);

      return popoverEl;
    };
  };
}

export function getDriverjsArrowPositioned() {
  return (arrowEl: HTMLElement, placement: string, arrowData: { x?: number, y?: number }) => {
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
      [staticSide]: '-5px', // Half of arrow size (10px)
    });
  };
}
