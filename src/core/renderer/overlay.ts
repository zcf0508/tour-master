/**
 * Inspired by https://github.com/kamranahmedse/driver.js/blob/1.3.4/src/overlay.ts
 */

import { toValue } from '@vue/reactivity';
import { useGlobalState } from '../../store';

export interface StageDefinition {
  x: number
  y: number
  width: number
  height: number
  padding?: number
  radius?: number
}

function generateStageSvgPathString(stages: StageDefinition[]): string {
  const windowX = window.innerWidth;
  const windowY = window.innerHeight;

  // Start with the outer rectangle path
  let path = `M${windowX},0L0,0L0,${windowY}L${windowX},${windowY}L${windowX},0Z`;

  // Add path for each stage
  stages.forEach((stage) => {
    const {
      padding = 0,
      radius = 0,
    } = stage;

    const stageWidth = stage.width + padding * 2;
    const stageHeight = stage.height + padding * 2;

    // prevent glitches when stage is too small for radius
    const limitedRadius = Math.min(radius, stageWidth / 2, stageHeight / 2);

    // no value below 0 allowed + round down
    const normalizedRadius = Math.floor(Math.max(limitedRadius, 0));

    const highlightBoxX = stage.x - padding + normalizedRadius;
    const highlightBoxY = stage.y - padding;
    const highlightBoxWidth = stageWidth - normalizedRadius * 2;
    const highlightBoxHeight = stageHeight - normalizedRadius * 2;

    // Add rounded rectangle path for current stage
    path += `M${highlightBoxX},${highlightBoxY} h${highlightBoxWidth} a${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius},${normalizedRadius} v${highlightBoxHeight} a${normalizedRadius},${normalizedRadius} 0 0 1 -${normalizedRadius},${normalizedRadius} h-${highlightBoxWidth} a${normalizedRadius},${normalizedRadius} 0 0 1 -${normalizedRadius},-${normalizedRadius} v-${highlightBoxHeight} a${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius},-${normalizedRadius} z`;
  });

  return path;
}

export function createOverlaySvg(
  stages: StageDefinition[] | (() => StageDefinition[]),
  /**
   * `stagePadding` and `stageRadius` will become the default value for all stages.
   */
  options?: Partial<{
    zIndex: number
    overlayColor: string
    overlayOpacity: number
    /**
     * This will become the default value for all stages.
     */
    stagePadding: number
    /**
     * This will become the default value for all stages.
     */
    stageRadius: number
  }>,
): SVGSVGElement {
  const {
    zIndex = 10000,
    overlayColor = 'rgb(0,0,0)',
    overlayOpacity = 0.7,
    stagePadding = 0,
    stageRadius = 0,
  } = options ?? {};

  const state = useGlobalState();

  function processedStages(): StageDefinition[] {
    return toValue(stages).map(
      stage => ({
        ...stage,
        padding: stage.padding ?? stagePadding,
        radius: stage.radius ?? stageRadius,
      }),
    );
  };

  state.currentStages.value = processedStages;

  const windowX = window.innerWidth;
  const windowY = window.innerHeight;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('driver-overlay', 'driver-overlay-animated');

  svg.setAttribute('viewBox', `0 0 ${windowX} ${windowY}`);
  svg.setAttribute('xmlSpace', 'preserve');
  svg.setAttribute('xmlnsXlink', 'http://www.w3.org/1999/xlink');
  svg.setAttribute('version', '1.1');
  svg.setAttribute('preserveAspectRatio', 'xMinYMin slice');

  svg.style.fillRule = 'evenodd';
  svg.style.clipRule = 'evenodd';
  svg.style.strokeLinejoin = 'round';
  svg.style.strokeMiterlimit = '2';
  svg.style.zIndex = `${zIndex}`;
  svg.style.position = 'fixed';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';

  const stagePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  stagePath.setAttribute(
    'd',
    generateStageSvgPathString(toValue(processedStages)),
  );

  stagePath.style.fill = overlayColor;
  stagePath.style.opacity = `${overlayOpacity}`;
  stagePath.style.pointerEvents = 'auto';
  stagePath.style.cursor = 'auto';

  svg.appendChild(stagePath);

  return svg;
}

export function refreshOverlay(): void {
  const state = useGlobalState();
  if (state.overlayDom.value) {
    const overlaySvg = state.overlayDom.value;

    const windowX = window.innerWidth;
    const windowY = window.innerHeight;

    overlaySvg.setAttribute('viewBox', `0 0 ${windowX} ${windowY}`);

    if (state.currentStages.value) {
      overlaySvg.children[0].setAttribute(
        'd',
        generateStageSvgPathString(toValue(state.currentStages.value)),
      );
    }
  }
}

function interpolateStages(
  fromStages: StageDefinition[],
  toStages: StageDefinition[],
  progress: number,
): StageDefinition[] {
  const maxLength = Math.max(fromStages.length, toStages.length);
  const result: StageDefinition[] = [];

  for (let i = 0; i < maxLength; i++) {
    const fromStage = fromStages[i] || toStages[i];
    const toStage = toStages[i] || fromStages[i];

    // If stage is being removed (exists in fromStages but not in toStages)
    // we'll fade it out by reducing its size
    if (!toStages[i] && fromStages[i]) {
      const scale = 1 - progress;
      result.push({
        x: fromStage.x + (fromStage.width * (1 - scale)) / 2,
        y: fromStage.y + (fromStage.height * (1 - scale)) / 2,
        width: fromStage.width * scale,
        height: fromStage.height * scale,
        padding: (fromStage.padding || 0) * scale,
        radius: fromStage.radius,
      });
      continue;
    }

    // If stage is being added (exists in toStages but not in fromStages)
    // we'll fade it in by increasing its size
    if (!fromStages[i] && toStages[i]) {
      const scale = progress;
      result.push({
        x: toStage.x + (toStage.width * (1 - scale)) / 2,
        y: toStage.y + (toStage.height * (1 - scale)) / 2,
        width: toStage.width * scale,
        height: toStage.height * scale,
        padding: (toStage.padding || 0) * scale,
        radius: toStage.radius,
      });
      continue;
    }

    // For stages that exist in both states, interpolate their properties
    result.push({
      x: fromStage.x + (toStage.x - fromStage.x) * progress,
      y: fromStage.y + (toStage.y - fromStage.y) * progress,
      width: fromStage.width + (toStage.width - fromStage.width) * progress,
      height: fromStage.height + (toStage.height - fromStage.height) * progress,
      padding: ((fromStage.padding || 0) + ((toStage.padding || 0) - (fromStage.padding || 0)) * progress),
      radius: (fromStage.radius || 0) + ((toStage.radius || 0) - (fromStage.radius || 0)) * progress,
    });
  }

  return result;
}

export function transitionStage(
  newStages: StageDefinition[] | (() => StageDefinition[]),
  options?: Partial<{
  /**
   * This will become the default value for all stages.
   */
    stagePadding: number
    /**
     * This will become the default value for all stages.
     */
    stageRadius: number
  }>,
): Promise<void> {
  return new Promise((resolve) => {
    const state = useGlobalState();
    if (!state.overlayDom.value || !state.currentStages.value) {
      resolve();
      return;
    }

    const startStages = state.currentStages.value;
    const overlaySvg = state.overlayDom.value;
    const duration = 300; // Animation duration in milliseconds
    const startTime = performance.now();

    function processedNewStages(): StageDefinition[] {
      return toValue(newStages).map(
        stage => ({
          ...stage,
          padding: stage.padding ?? options?.stagePadding,
          radius: stage.radius ?? options?.stageRadius,
        }),
      );
    };

    function animate(currentTime: number): void {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easeInOutCubic easing function for smooth animation
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - (-2 * progress + 2) ** 3 / 2;

      const interpolatedStages = interpolateStages(toValue(startStages), toValue(processedNewStages), eased);

      overlaySvg.children[0].setAttribute(
        'd',
        generateStageSvgPathString(interpolatedStages),
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
      else {
        state.currentStages.value = processedNewStages;
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}
