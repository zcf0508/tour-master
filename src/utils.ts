export async function waitForAllAnimations(timeout = 2000): Promise<void> {
  return new Promise<void>((resolve) => {
    const startTime = Date.now();
    function checkAnimations(): void {
      // timeout
      if (Date.now() - startTime > timeout) {
        resolve();
        return;
      }

      const animations = document.getAnimations();

      const runningAnimations = animations.filter(
        animation => (
          // @ts-expect-error chrome only
          animation?.animationName
          && animation.playState === 'running'),
      );

      if (runningAnimations.length === 0) {
        resolve();
      }
      else {
        requestAnimationFrame(checkAnimations);
      }
    };

    // ensure animations has started
    setTimeout(() => {
      requestAnimationFrame(checkAnimations);
    }, /** 2 frames */32);
  });
}
