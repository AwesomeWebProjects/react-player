import { babel } from '@rollup/plugin-babel'
import { string } from 'rollup-plugin-string'
import analyze from 'rollup-plugin-analyzer'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import json from '@rollup/plugin-json'
import postcss from 'rollup-plugin-postcss'
import progress from 'rollup-plugin-progress'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'
import html from 'rollup-plugin-html-scaffold'
import { terser } from 'rollup-plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import ts from '@rollup/plugin-typescript'
import typescript from 'typescript'
import pkg from './package.json'

const input = ['src/index.ts']

const name = 'ReactComponents'

const external = ['react', 'react-dom', 'prop-types', 'classnames']

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  classnames: 'classNames',
  'prop-types': 'PropTypes',
}

const [debugArg] = process.argv.filter((item) => item === '--config-debug=true')
const isInDebugMode = Boolean(debugArg)

const plugins = [
  progress(),
  html({
    input: './public/index.html',
    output: './dist/index.html',
    template: { appBundle: 'index.js' },
  }),
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.APP_ASSETS_URL': JSON.stringify(process.env.APP_ASSETS_URL),
    },
  }),
  string({ include: '**/*.html' }),
  json(),
  postcss({
    extract: true,
    autoModules: true,
    include: '**/*.css',
    extensions: ['.css'],
  }),
  nodeResolve({
    modulePaths: ['src', 'node_modules', 'src/components'],
  }),
  ts({
    typescript,
    tsconfig: './tsconfig.json',
  }),
  commonjs({
    include: 'node_modules/**',
  }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: ['@babel/env', '@babel/preset-react'],
  }),
  !isInDebugMode && terser(),
  copy({
    targets: [
      { src: 'assets', dest: 'dist/' },
      { src: 'public/manifest.json', dest: 'dist/' },
      { src: 'public/offline.html', dest: 'dist/' },
    ],
    verbose: true,
  }),
  analyze(),
  filesize(),
]

const outputData = [
  {
    file: pkg.browser,
    format: 'umd',
  },
  {
    file: pkg.main,
    format: 'cjs',
  },
  {
    file: pkg.module,
    format: 'es',
  },
]

const config = outputData.map(({ file, format }) => ({
  input,
  output: {
    file,
    format,
    name,
    globals,
  },
  external,
  plugins,
}))

export default config
