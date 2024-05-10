# Nuxt Layers Utils

> A collection of utilities to work with Nuxt layers

## Abstract

[Nuxt Layers](https://nuxt.com/docs/guide/going-further/layers) are great to modularise your applications, but they can be fiddly, verbose and repetitive to configure when you have many layers, reconfigured folders, aliases, nested component folders, auto-imports, etc.

Nuxt Layers Utils provides a [common interface](#api) to generate these disparate configuration options – hopefully saving you from shouting at your laptop because you misconfigured some path setting.

## Usage

### Installation

Install from NPM:

```bash
npm i --save-dev nuxt-layers-utils
```

### Configuration

> [!IMPORTANT]
> Read this before designing your layers

Nuxt's [path-oriented configuration settings](#nuxt-config) take a variety of formats: [absolute](https://nuxt.com/docs/api/nuxt-config#alias), [relative](https://nuxt.com/docs/api/nuxt-config#dir), [folder names](https://nuxt.com/docs/api/nuxt-config#extends), [root-relative](https://nuxt.com/docs/api/nuxt-config#srcdir), [layer-relative](https://nuxt.com/docs/api/nuxt-config#extends), [aliased](https://nuxt.com/docs/api/nuxt-config#components), etc, etc, and it's not always clear which should be used when. Additionally, not all settings [work as expected](https://nuxt.com/docs/api/nuxt-config#imports) when configured in [layer config](https://nuxt.com/docs/guide/going-further/layers) files.

And because it's tricky to chase down path-related config across multiple folders, I **strongly recommend** to configure everything *path-related* in your project's **main** `nuxt.config.ts`.

See my article on Nuxt Layers for more information:

- [davestewart.co.uk/blog/nuxt-layers](https://davestewart.co.uk/blog/nuxt-layers)

### Simple example

A simple example with:

- three layers
- path aliases

```ts
import { useLayers } from 'nuxt-layers-utils'

const layers = useLayers(__dirname, {
  core: 'core',
  blog: 'layers/blog',
  site: 'layers/site',
})

export default defineNuxtConfig({
  extends: layers.extends(),
  alias: layers.alias('#'),
})
```

That generates:

```js
export default {
  extends: [
    'core',
    'layers/blog',
    'layers/site'
  ],
  alias: {
    '#core': '/Volumes/Projects/some-project/core',
    '#blog': '/Volumes/Projects/some-project/layers/blog',
    '#site': '/Volumes/Projects/some-project/layers/site',
  },
}
```

### Complex example

A complex example with:

- multiple layers
- layer aliases
- additional custom aliases
- reconfigured default folders
- additional auto-imports
- vite aliases

```ts
import { useLayers } from 'nuxt-layers-utils'
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'pathe'

// configure helper
const layers = useLayers(__dirname, {
  core: 'core',
  auth: 'layers/auth',
  account: 'layers/account',
  services: 'layers/services',
  site: 'layers/site',
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
  '#basicscroll': 'basicscroll',
}

// build the final config 
export default defineNuxtConfig({
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
})
```

A manual setup might look more like:

```js
export default {
  // layers
  extends: [
    'core',
    'layers/auth',
    'layers/account',
    'layers/services',
    'layers/site'
  ],

  // aliases, layers, core and third party
  alias: {
    // layer-level aliases (prefixed with a `#`)
    '#core': '/Volumes/Projects/some-project/core',
    '#auth': '/Volumes/Projects/some-project/layers/auth',
    '#account': '/Volumes/Projects/some-project/layers/account',
    '#tools': '/Volumes/Projects/some-project/layers/services',
    '#site': '/Volumes/Projects/some-project/layers/site',

    // core
    '~/components': '/Volumes/Projects/some-project/core/components',
    '~/composables': '/Volumes/Projects/some-project/core/composables',
    '~/utils': '/Volumes/Projects/some-project/core/utils',
    '~/public': '/Volumes/Projects/some-project/layers/site/public',
    '~/pages': '/Volumes/Projects/some-project/layers/site/pages',

    // third-party
    '~/libs': '/Volumes/Projects/libs',
    '#basicscroll': 'basicscroll'
  },

  // auto-imports
  imports: {
    dirs: [
      'core/config',
      'core/state',
      'layers/auth/config',
      'layers/auth/state',
      'layers/account/config',
      'layers/account/state',
      'layers/services/config',
      'layers/services/state',
      'layers/site/config',
      'layers/site/state'
    ]
  },

  // default folders
  dir: {
    // core
    middleware: 'core/middleware',
    modules: 'core/modules',
    plugins: 'core/plugins',

    // site
    assets: 'layers/site/assets',
    layouts: 'layers/site/layouts',
    pages: 'layers/site/pages',
    public: 'layers/site/public'
  },

  // aliases for vite (transformed version of core aliases)
  vite: {
    resolve: {
      alias: [
        { find: '...', replace: '...' },
        ...
      ]
    }
  }
}
```

## API

### Intro

Nuxt Layer Utils is basically a factory which:

- takes an absolute folder path
- takes a layer config object
- provides a set of methods to generate path config
- provides some additional utility functions

Factory function:

- [useLayers()](#uselayers)

Config methods _(named after the config they provide)_:

- [layers.extends()](#getextends)
- [layers.dir()](#getdir)
- [layers.dirPath()](#getdirpath)
- [layers.importsDirs()](#getimportsdirs)
- [layers.components()](#getcomponents)
- [layers.alias()](#getalias)
- [layers.viteResolveAlias()](#getviteresolvealias)

Utilities:

- [layers.rel()](#rel)
- [layers.abs()](#abs)
- [layers.only()](#only)

### `useLayers()`

Factory function to provide a standardised interface to generate layer and path-specific config.

**Params:**

```
@param baseDir   The absolute path to the project `nuxt.config.ts`
@param layers    A hash of layer keys and relative folder paths
```

**Example:**

```ts
const layers = useLayers(__dirname, {
  core: 'core',
  blog: 'layers/blog',
  site: 'layers/site',
  ...
})

export default defineNuxtConfig({
  alias: layers.alias(),
  ...
})
```

### `extends()`

> Used with [`config.extends`](https://nuxt.com/docs/api/nuxt-config#extends)

Generates the array of relative folder paths which Nuxt should treat as layers

**Example:**

```ts
{
  extends: layers.extends()
}
```

**Result:**

```js
{
  extends: [
    'core',
    'layers/blog',
    'layers/site'
  ]
}
```

### `dir()`

> Used with [`config.dir`](https://nuxt.com/docs/api/nuxt-config#dir)

Reconfigures Nuxt's core default folders, such as `assets`, `modules`, `server`, etc.

**Params:**

```
@param key         A valid layer key, i.e. 'core'
@param folders     An array of valid config.dir folder keys
```

**Example:**

```ts
{
  dir: layers.dir('core', ['assets', 'modules'])
}
```

**Result:**

```js
{
  dir: {
    assets: 'core/assets',
    modules: 'core/modules'
  }
}
```

### `dirPath()`

> Used with [`config.dir[folder]`](https://nuxt.com/docs/api/nuxt-config#dir)

Generate a single relative path from a named layer.

**Params:**

```
 @param key         A valid layer key, i.e. 'core'
 @param folder      A valid config.dir folder, i.e. 'assets'
```

**Example:**

```ts
{
  dir: {
    assets: layers.dirPath('site', 'assets')
  }
}
```

**Result:**

```js
{
  dir: {
    assets: 'layers/site/assets'
  }
}
```

### `importsDirs()`

> Used with [`config.imports.dirs`](https://nuxt.com/docs/api/nuxt-config#imports)

Determines which folders should be auto-imported by Nuxt.

**Params:**

```
 @param folders   An optional list of folders, defaults to AUTO_IMPORTS
```

**Example:**

```ts
{
  imports: {
    dirs: layers.importsDirs([
      'store'
    ])
  }
}
```

**Result:**

```js
{
  imports: {
    dirs: [
      'core/store',
      'layers/blog/store',
      'layers/site/store',
    ]
  }
}
```

### `components()`

Used with [`config.components`](https://nuxt.com/docs/api/nuxt-config#components)

Determines additional component registration. See the [docs](https://nuxt.com/docs/guide/directory-structure/components#custom-directories) for more info on the method parameters.

**Params:**

```
@param options
@param options.pathPrefix    Optional Boolean to prefix the component name with path, defaults to true
@param options.prefix        Optional String to prefix the component name with 
```

**Example:**

```ts
{
  components: layers.components({ prefix: 'App' })
}
```

**Result:**

```js
{
  components: [
    { path: '~/core/components', prefix: 'App' },
    { path: '~/layers/blog/components', prefix: 'App' },
    { path: '~/layers/site/components', prefix: 'App' },
  ]
}
```

### `alias()`

> Used with [`config.alias`](https://nuxt.com/docs/api/nuxt-config#alias)

Generates path aliases for both named layers and arbitrary folders.

**Params:**

```
 @param prefix      The required alias prefix
 @param folders     An optional set of folder paths, defaults to layers config
```

**Example 1;** generate default layer aliases:

```ts
{
  alias: layers.alias('#')
}
```

**Result:**

```js
{
  alias: {
    '#core': '/Volumes/Projects/some-project/core',
    '#blog': '/Volumes/Projects/some-project/layers/blog',
    '#site': '/Volumes/Projects/some-project/layers/site',
  }
}
```

**Example 2;** generate custom aliases:

```ts
{
  alias: layers.alias('~/', [
    'foo/components',
  ])
}
```

**Result:**

```js
{
  alias: {
    '~/foo/components': '/Volumes/Projects/some-project/foo/components',
  }
}
```

### `viteResolveAlias()`

> Used with [`config.vite.resolve.alias`](https://vitejs.dev/config/shared-options.html#resolve-alias)

> [!Note]
> This seems to be required when adding additional layer aliases (but do your own checks)

Generate path aliases for Vite.

**Params:**

```
@param aliases     The same alias hash used in `config.alias`
```

**Example:**


```ts
// pass the same `alias` hash to both configurations
const alias = { ... }

{
  alias: layers.alias(alias)
  vite: {
    resolve: {
      alias: layers.viteResolveAlias(alias)
    }
  }
}
```

**Result:**

```js
{
  vite: {
    alias: { ... },
    resolve: {
      alias: [
        { find: '#core', replace: '/Volumes/Projects/some-project/core' },
        { find: '#blog', replace: '/Volumes/Projects/some-project/layers/blog' },
        { find: '#site', replace: '/Volumes/Projects/some-project/layers/site' },
      ]
    }
  }
}
```

## Utils

### `rel()`

Generate the relative path to a layer folder or sub-folder.

```
@param key         A valid layer key, i.e. 'site'
@param folder      An optional folder, i.e. 'assets'
```

**Example:**

```ts
layers.rel('site', 'assets')
```

**Result:**

```js
'layers/site/assets'
```

### `abs()`

Generate the absolute path to a layer folder or sub-folder.

```
@param key         A valid layer key, i.e. 'site'
@param folder      An optional folder, i.e. 'assets'
```

**Example:**

```ts
layers.abs('site', 'assets')
```

**Result:**

```js
'/Volumes/Projects/some-project/layers/site/assets'
```


### `only()`

Choose only certain layers to get config for.

**Params:**

```
@param filter       A space-delimited string of layer keys, or an array of layer keys
```

**Example:**

```ts
const alias = {
  ...layers.only('site').alias('~/', [
    'components',
    'composables',
    'utils',
  ]),
}
```

**Result:**

```js
{
  alias: {
    '~/components' : '/Volumes/Projects/some-project/layers/site/components',
    '~/composables' : '/Volumes/Projects/some-project/layers/site/composables',
    '~/utils' : '/Volumes/Projects/some-project/layers/site/utils',
  }
}
```

## Addendum

### Nuxt config

Nuxt config options which may reference paths or folders.

**Layer-specific:**

- [alias](https://nuxt.com/docs/api/nuxt-config#alias)
- [components](https://nuxt.com/docs/api/nuxt-config#components)
- [dir](https://nuxt.com/docs/api/nuxt-config#dir)
- [extends](https://nuxt.com/docs/api/nuxt-config#extends)
- [imports.dirs](https://nuxt.com/docs/api/nuxt-config#imports)

**Core folders:**

- [analyseDir](https://nuxt.com/docs/api/nuxt-config#analyzedir)
- [app.buildAssetsDir](https://nuxt.com/docs/api/nuxt-config#buildassetsdir)
- [buildDir](https://nuxt.com/docs/api/nuxt-config#builddir)
- [modulesDir](https://nuxt.com/docs/api/nuxt-config#modulesdir)
- [rootDir](https://nuxt.com/docs/api/nuxt-config#rootdir)
- [serverDir](https://nuxt.com/docs/api/nuxt-config#serverdir)
- [srcDir](https://nuxt.com/docs/api/nuxt-config#srcdir)
- [workspaceDir](https://nuxt.com/docs/api/nuxt-config#workspacedir)

**Other:**

- [build.templates](https://nuxt.com/docs/api/nuxt-config#templates)
- [css](https://nuxt.com/docs/api/nuxt-config#css)
- [experimental.localLayerAliases](https://nuxt.com/docs/api/nuxt-config#templates)
- [ignore](https://nuxt.com/docs/api/nuxt-config#ignore)
- [modules](https://nuxt.com/docs/api/nuxt-config#modules-1)
- [plugins](https://nuxt.com/docs/api/nuxt-config#plugins-1)
- [watch](https://nuxt.com/docs/api/nuxt-config#watch)
- [serverHandlers](https://nuxt.com/docs/api/nuxt-config#serverhandlers)
- [spaLoadingTemplate](https://nuxt.com/docs/api/nuxt-config#spaloadingtemplate)
- [vite.publicDir](https://nuxt.com/docs/api/nuxt-config#publicdir)
- [vite.resolve.alias](https://nuxt.com/docs/api/nuxt-config#resolve)
- [vite.root](https://nuxt.com/docs/api/nuxt-config#root)
- [webpack.analyze](https://nuxt.com/docs/api/nuxt-config#analyze-1)
