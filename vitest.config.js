import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    deps: {
      inline: ['vitest-canvas-mock'],
    },
    threads: false,
  },
});
