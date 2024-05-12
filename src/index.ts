import { inspect } from 'node:util'
import { join } from 'pathe'

export type Layers = Record<string, string>

export type NuxtDir =
  | 'assets'
  | 'layouts'
  | 'middleware'
  | 'modules'
  | 'pages'
  | 'plugins'
  | 'public'

const AUTO_IMPORTS = ['components', 'composables', 'utils']

/**
 * Helper function to debug generated config
 */
export function logConfig<T> (config: T): T {
  /* v8 ignore next 4 */
  // eslint-disable-next-line
  console.log(inspect(config, { depth: 20, colors: true }))
  return config
}

/**
 * Helper function to split string of layer keys to array of layer keys
 */
function getKeys (filter: string | string[]) {
  return Array.isArray(filter)
    ? filter
    : filter
      .trim()
      .split(/\s+/)
}

/**
 * Nuxt layers helper
 *
 * Factory function to provide a standardised interface to generate layer and path-specific config
 * Methods are named after the config they provide.
 *
 * @param     baseDir   The absolute path to the base `nuxt.config.ts` file
 * @param     layers    A hash of layer keys and config-relative relative folder paths
 */
export function useLayers (baseDir = __dirname, layers: Layers) {
  /**
   * Test layer key is valid
   *
   * @param     key         A valid layer key, i.e. 'core'
   */
  const assertLayerKey = (key: string) => {
    if (!Object.keys(layers).includes(key)) {
      throw new Error(`Invalid layer "${key}"`)
    }
  }

  return {
    /**
     * Get the original layers config
     * @returns               A hash of key:relative path pairs
     */
    get layers () {
      return layers
    },

    /**
     * Generate `config.extends` layer folders array
     *
     * @see https://nuxt.com/docs/api/nuxt-config#extends
     *
     * @returns               An array of relative paths
     */
    extends () {
      return Object.values(layers)
    },

    /**
     * Generate partial `config.dir` relative folders hash
     *
     * @see https://nuxt.com/docs/api/nuxt-config#dir
     *
     * @param     key         A valid layer key, i.e. 'core'
     * @param     folders     An array of valid config.dir folder keys
     * @returns               A hash of key:relative path pairs
     */
    dir (key: keyof typeof layers, folders: NuxtDir[]) {
      assertLayerKey(key)
      return folders.reduce((output, folder) => {
        output[folder] = this.rel(key, folder)
        return output
      }, {} as Record<NuxtDir, string>)
    },

    /**
     * Generate single `config.dir` relative path
     *
     * @see https://nuxt.com/docs/api/nuxt-config#dir
     *
     * @param     key         A valid layer key, i.e. 'core'
     * @param     folder      A valid config.dir folder, i.e. 'assets'
     * @returns               A relative path
     */
    dirPath (key: keyof typeof layers, folder?: NuxtDir) {
      assertLayerKey(key)
      return this.rel(key, folder)
    },

    /**
     * Generate `config.imports.dir` config
     *
     * @see https://nuxt.com/docs/api/nuxt-config#imports
     *
     * @param     folders     An optional list of folders
     * @returns               An array of relative paths
     */
    importsDirs (folders = AUTO_IMPORTS) {
      return this.arr((key, rel) => {
        return folders.map((folder: string) => {
          return join(rel, folder)
        })
      }).flat()
    },

    /**
     * Generate `config.components` array
     *
     * @see https://nuxt.com/docs/guide/directory-structure/components#custom-directories
     * @see https://nuxt.com/docs/api/nuxt-config#components
     *
     * @param     options
     * @param     options.pathPrefix    Optional Boolean to prefix the component name with path, defaults to true
     * @param     options.prefix        Optional String to prefix the component name with
     * @returns                         An array of component config options
     */
    components (options: { pathPrefix?: boolean, prefix?: string } = {}) {
      const hasOptions = Object.values(options).length > 0
      return this.arr((key, rel) => {
        const path = `~/${rel}/components`
        return hasOptions
          ? { path, ...options }
          : path
      })
    },

    /**
     * Generate `content.sources` hash
     *
     * @see https://content.nuxt.com/get-started/configuration#sources
     *
     * Tip: combine with layers.only() to target only layers with content folders
     *
     * @param     prefix      An optional prefixing option; defaults to 'auto'
     *                        - 'auto' to prefix all but the first layer
     *                        - an object to map layer keys to prefixes
     *                        - true to prefix with the layer key, i.e. '/blog'
     *                        - false for no prefix
     * @returns               A hash of key:source pairs
     */
    contentSources (prefix: 'auto' | Record<string, any> | boolean = 'auto') {
      return this.obj((key, rel, abs, index) => {
        const prefixed = (prefix === 'auto' && index === 0) || prefix === false
          ? {}
          : prefix && typeof prefix === 'object'
            ? { prefix: `/${prefix[key]}` }
            : { prefix: `/${key}` }
        return {
          ...prefixed,
          base: join(abs, 'content'),
          driver: 'fs',
        }
      })
    },

    /**
     * Generate `config.alias` hash
     *
     * @see https://nuxt.com/docs/api/nuxt-config#alias
     *
     * @param     prefix      A required alias prefix
     * @param     folders     An optional
     * @returns               A hash of key:absolute path pairs
     */
    alias (prefix: string = '#', folders?: string[] | true): Layers {
      const output: Record<string, string> = {}
      if (folders) {
        const key = Object.keys(layers).shift()
        if (key) {
          for (const folder of Array.isArray(folders) ? folders : AUTO_IMPORTS) {
            output[prefix + folder] = this.abs(key, folder)
          }
        }
      }
      else {
        for (const key of Object.keys(layers)) {
          output[prefix + key] = this.abs(key)
        }
      }
      return output
    },

    /**
     * Generate `config.vite.resolve.alias` aliases
     *
     * This seems to be required when adding additional layer aliases
     *
     * @see https://nuxt.com/docs/api/nuxt-config#resolve
     *
     * @param     aliases     The same alias hash used in `config.alias`
     * @returns               An array of find:replace pairs
     */
    viteResolveAlias (aliases: Record<string, string>) {
      return Object
        // note the object format does not seem to work, so we use the array format
        // https://github.com/rollup/plugins/tree/master/packages/alias#entries
        .entries(aliases)
        .map(([find, replacement]) => {
          return { find, replacement }
        })
    },

    /**
     * Choose only certain layers to get config for
     *
     * @param     filter      A space-delimited string of layer keys, or an array of layer keys
     * @returns               A new useLayers() instance with only the specified layers
     */
    only (filter: string | Array<keyof typeof layers>) {
      const keys = getKeys(filter)
      keys.forEach(assertLayerKey)
      const filtered = keys
        .reduce((output, key) => {
          output[key] = layers[key]
          return output
        }, {} as Record<keyof typeof layers, string>)
      return useLayers(baseDir, filtered)
    },

    /**
     * Get the relative path for a layer, or one of its folders
     *
     * @see https://nuxt.com/docs/api/nuxt-config#dir
     *
     * @param     key         A valid layer key, i.e. 'core'
     * @param     folder      A valid config.dir folder, i.e. 'assets'
     * @returns               A relative path
     */
    rel (key: keyof typeof layers, folder = '') {
      assertLayerKey(key)
      return join(layers[key], folder)
    },

    /**
     * Get the absolute path for a layer, or one of its folders
     *
     * @param     key         A valid layer key, i.e. 'core'
     * @param     folder      A valid `config.dir` folder, i.e. 'assets'
     * @returns               An absolute path
     */
    abs (key: keyof typeof layers, folder = '') {
      assertLayerKey(key)
      return join(baseDir, layers[key], folder)
    },

    /**
     * Utility function to return a hash of config options from a user-defined callback
     *
     * @param     callback    Callback function passing key, rel, abs and index values
     * @returns               A hash of key:user-defined options
     */
    obj<T> (callback: (key: keyof typeof layers, rel: string, abs: string, index: number) => T): Record<string, T> {
      const output: Record<string, T> = {}
      let index = 0
      for (const key of Object.keys(layers)) {
        output[key] = callback(key, layers[key], this.abs(key), index++)
      }
      return output
    },

    /**
     * Utility function to return an array of config options from a user-defined callback
     *
     * @param     callback    Callback function passing key, rel, abs and index values
     * @returns               An array of user-defined options
     */
    arr<T> (callback: (key: keyof typeof layers, rel: string, abs: string, index: number) => T): T[] {
      return Object.entries(layers).map(([key, rel], index) => {
        return callback(key, rel, this.abs(key), index)
      })
    },
  }
}
