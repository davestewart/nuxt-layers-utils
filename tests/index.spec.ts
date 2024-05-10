import { describe, expect, it } from 'vitest'
import { useLayers } from '../src'

// variables
const mainDir = '/projects/project'
const layers = useLayers(mainDir, {
  core: 'core',
  blog: 'layers/blog',
  site: 'layers/site',
})

describe('useLayers', () => {
  describe('getPath', () => {
    it('should return the correct path for a layer', () => {
      expect(layers.path('core')).toBe('/projects/project/core')
    })

    it('should return the correct path for a layer and folder', () => {
      expect(layers.path('blog', 'assets')).toBe('/projects/project/layers/blog/assets')
    })

    it('throws an error for invalid layer keys', () => {
      expect(() => layers.path('invalid')).toThrow('Invalid layer "invalid"')
    })
  })

  describe('getExtends', () => {
    it('should return all layer folders', () => {
      expect(layers.extends()).toEqual([
        'core',
        'layers/blog',
        'layers/site',
      ])
    })
  })

  describe('getDir', () => {
    it('should return the directory mapping for specified folders', () => {
      const result = layers.dir('blog', ['assets', 'plugins'])
      expect(result).toEqual({
        assets: 'layers/blog/assets',
        plugins: 'layers/blog/plugins',
      })
    })
  })

  describe('getDirPath', () => {
    it('should return the directory path for a given folder', () => {
      expect(layers.dirPath('site', 'assets')).toBe('layers/site/assets')
    })
  })

  describe('getImportsDirs', () => {
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

  describe('getComponents', () => {
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

  describe('getAlias', () => {
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

  describe('getViteResolveAlias', () => {
    it('should convert aliases to Vite resolve format', () => {
      const aliases = { '#core': '/projects/project/core' }
      const result = layers.viteResolveAlias(aliases)
      expect(result).toEqual([{ find: '#core', replacement: '/projects/project/core' }])
    })
  })

  describe('only', () => {
    it('should filter and return only the specified layers', () => {
      const newLayers = layers.only('core')
      expect(newLayers.extends()).toEqual([
        'core',
      ])
    })
  })
})
