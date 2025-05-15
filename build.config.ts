import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  clean: true,
  declaration: 'node16',
  externals: ['@floating-ui/dom'],
  failOnWarn: false,
});
