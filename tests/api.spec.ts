import { describe, expect, it } from 'vitest'
import { useLayers } from '../src'

// variables
const baseDir = '/projects/project'
const layers = useLayers(baseDir, {
  core: 'core',
  blog: 'layers/blog',
  site: 'layers/site',
})

describe('api', () => {
  describe('extends', () => {
    it('should return all layer folders', () => {
      expect(layers.extends()).toEqual([
        'core',
        'layers/blog',
        'layers/site',
      ])
    })
  })

  describe('dir', () => {
    it('should return the directory mapping for specified folders', () => {
      const result = layers.dir('blog', ['assets', 'plugins'])
      expect(result).toEqual({
        assets: 'layers/blog/assets',
        plugins: 'layers/blog/plugins',
      })
    })
  })

  describe('dirPath', () => {
    it('should return the directory path for a given folder', () => {
      expect(layers.dirPath('site', 'assets')).toBe('layers/site/assets')
    })
  })

  describe('importsDirs', () => {
    it('should generate import paths for default directories', () => {
      const result = layers.importsDirs()
      expect(result).toEqual([
        'core/components',
        'core/composables',
        'core/utils',
        'layers/blog/components',
        'layers/blog/composables',
        'layers/blog/utils',
        'layers/site/components',
        'layers/site/composables',
        'layers/site/utils',
      ])
    })
  })

  describe('components', () => {
    it('should return component paths with defaults', () => {
      const result = layers.components()
      expect(result).toEqual([
        '~/core/components',
        '~/layers/blog/components',
        '~/layers/site/components',
      ])
    })

    it('should handle options for component paths', () => {
      const result = layers.components({ pathPrefix: false, prefix: 'Custom' })
      expect(result).toEqual([
        { path: '~/core/components', pathPrefix: false, prefix: 'Custom' },
        { path: '~/layers/blog/components', pathPrefix: false, prefix: 'Custom' },
        { path: '~/layers/site/components', pathPrefix: false, prefix: 'Custom' },
      ])
    })
  })

  describe('contentSources', () => {
    it('should return a content source', () => {
      const result = layers.only('site').contentSources()
      expect(result).toEqual({
        site: {
          base: '/projects/project/layers/site/content',
          driver: 'fs',
        },
      })
    })

    it('should automatically prefix later layers', () => {
      const result = layers.only('site blog').contentSources()
      expect(result).toEqual({
        site: {
          base: '/projects/project/layers/site/content',
          driver: 'fs',
        },
        blog: {
          prefix: '/blog',
          base: '/projects/project/layers/blog/content',
          driver: 'fs',
        },
      })
    })

    it('should skip prefixing if set to false', () => {
      const result = layers.only('site blog').contentSources(false)
      expect(result).toEqual({
        site: {
          base: '/projects/project/layers/site/content',
          driver: 'fs',
        },
        blog: {
          base: '/projects/project/layers/blog/content',
          driver: 'fs',
        },
      })
    })

    it('should remap prefixes when object passed', () => {
      const result = layers.only('site blog').contentSources({ site: 'the-site', blog: 'the-blog' })
      expect(result).toEqual({
        site: {
          base: '/projects/project/layers/site/content',
          prefix: '/the-site',
          driver: 'fs',
        },
        blog: {
          base: '/projects/project/layers/blog/content',
          prefix: '/the-blog',
          driver: 'fs',
        },
      })
    })
  })

  describe('alias', () => {
    it('should return aliases for layers when no options are passed', () => {
      const result = layers.alias('#')
      expect(result).toEqual({
        '#core': '/projects/project/core',
        '#blog': '/projects/project/layers/blog',
        '#site': '/projects/project/layers/site',
      })
    })

    it('should return aliases for user-defined layers when folders is true', () => {
      const result = layers.alias('#', true)
      expect(result).toEqual({
        '#components': '/projects/project/core/components',
        '#composables': '/projects/project/core/composables',
        '#utils': '/projects/project/core/utils',
      })
    })

    it('should return aliases for provided folders', () => {
      const result = layers.alias('#', ['utils'])
      expect(result).toEqual({
        '#utils': '/projects/project/core/utils',
      })
    })
  })

  describe('viteResolveAlias', () => {
    it('should convert aliases to Vite resolve format', () => {
      const aliases = { '#core': '/projects/project/core' }
      const result = layers.viteResolveAlias(aliases)
      expect(result).toEqual([{ find: '#core', replacement: '/projects/project/core' }])
    })
  })
})

describe('utilities', () => {
  describe('only', () => {
    it('should filter specified layers when passing a string', () => {
      const newLayers = layers.only('core')
      expect(newLayers.extends()).toEqual([
        'core',
      ])
    })

    it('should filter specified layers when passing an array', () => {
      const newLayers = layers.only(['core', 'blog'])
      expect(newLayers.extends()).toEqual([
        'core',
        'layers/blog',
      ])
    })

    it('should order specified layers by the order of keys passed', () => {
      const newLayers = layers.only('site blog')
      expect(newLayers.extends()).toStrictEqual([
        'layers/site',
        'layers/blog',
      ])
    })
  })

  describe('rel', () => {
    it('should return the correct relative path for a layer', () => {
      expect(layers.rel('core')).toBe('core')
    })

    it('should return the correct relative path for a layer and folder', () => {
      expect(layers.rel('blog', 'assets')).toBe('layers/blog/assets')
    })

    it('throws an error for invalid layer keys', () => {
      expect(() => layers.rel('invalid')).toThrow('Invalid layer "invalid"')
    })
  })

  describe('abs', () => {
    it('should return the correct absolute path for a layer', () => {
      expect(layers.abs('core')).toBe('/projects/project/core')
    })

    it('should return the correct absolute path for a layer and folder', () => {
      expect(layers.abs('blog', 'assets')).toBe('/projects/project/layers/blog/assets')
    })

    it('throws an error for invalid layer keys', () => {
      expect(() => layers.abs('invalid')).toThrow('Invalid layer "invalid"')
    })
  })

  describe('obj', () => {
    it('should return a hash of config options', () => {
      expect(layers.only('core site').obj((key, rel, abs, index) => {
        return [key, rel, abs, index].join('|')
      })).toStrictEqual({
        core: 'core|core|/projects/project/core|0',
        site: 'site|layers/site|/projects/project/layers/site|1',
      })
    })
  })

  describe('arr', () => {
    it('should return an array of config options', () => {
      expect(layers.only('core site').arr((key, rel, abs, index) => {
        return [key, rel, abs, index].join('|')
      })).toStrictEqual([
        'core|core|/projects/project/core|0',
        'site|layers/site|/projects/project/layers/site|1',
      ])
    })
  })
})
