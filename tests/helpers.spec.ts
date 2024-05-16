import { describe, expect, it } from 'vitest'
import { useLayers, logConfig } from '../src'
import { resolve } from 'pathe'

// helper function for demo
function defineNuxtConfig <T>(config: T): T {
  return config
}

// configure helper
const layers = useLayers(__dirname, {
  core: 'core',
  auth: 'layers/auth',
  account: 'layers/account',
  services: 'layers/services',
  site: 'layers/site',
  blog: 'layers/blog',
})

// set up global aliases; note is a mix of layer and non layer code
const alias = {
  // layers
  ...layers.alias('#'),

  // core
  ...layers.only('core').alias('~/', [
    'components',
    'composables',
    'utils',
  ]),

  // site
  ...layers.only('site').alias('~/', [
    'public',
    'pages',
  ]),

  // third party
  '~/libs': resolve('../../libs'),
}

describe('helpers', () => {
  describe('logConfig', () => {
    // remove skip to see result
    it.skip('should log the final config', function () {
      // build the final config
      logConfig(defineNuxtConfig({
        // add all layers
        extends: layers.extends(),

        // reconfigure core nuxt folders
        dir: {
          ...layers.dir('core', [
            'middleware',
            'modules',
            'plugins',
          ]),
          ...layers.dir('site', [
            'assets',
            'layouts',
            'pages',
            'public',
          ]),
        },

        content: {
          sources: layers.only('site blog').contentSources()
        },

        // add additional layer auto-import folders
        imports: {
          dirs: [
            ...layers.importsDirs([
              'config',
              'state',
            ]),
          ],
        },

        // add layer aliases
        alias,

        // configure vite to use the same aliases
        vite: {
          resolve: {
            alias: layers.viteResolveAlias(alias),
          },
        },
      }))
    })
  })
})
