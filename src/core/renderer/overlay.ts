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
  stages: StageDefinition[],
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

  const processedStages = stages.map(
    stage => ({
      ...stage,
      padding: stage.padding ?? stagePadding,
      radius: stage.radius ?? stageRadius,
    }),
  );

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
    generateStageSvgPathString(processedStages),
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
        generateStageSvgPathString(state.currentStages.value),
      );
    }
  }
}
