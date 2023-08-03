// import { babel } from '@rollup/plugin-babel'
import { string } from 'rollup-plugin-string'
import analyze from 'rollup-plugin-analyzer'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import json from '@rollup/plugin-json'
import postcss from 'rollup-plugin-postcss'
import progress from 'rollup-plugin-progress'
import html from 'rollup-plugin-html-scaffold'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import ts from '@rollup/plugin-typescript'
import typescript from 'typescript'

const input = ['src/index-dev.tsx']

const name = 'ReactComponents'

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  classnames: 'classNames',
  'prop-types': 'PropTypes',
}

const plugins = [
  progress(),
  html({
    input: './public/index.html',
    output: './build/index.html',
    template: { appBundle: 'index.js' },
  }),
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify('development'),
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
  // babel({
  //   babelHelpers: 'bundled',
  //   exclude: 'node_modules/**',
  //   presets: ['@babel/env', '@babel/preset-react'],
  // }),
  analyze(),
  filesize(),
  copy({
    targets: [
      { src: 'assets', dest: 'build/' },
      { src: 'public/manifest.json', dest: 'build/' },
      { src: 'public/offline.html', dest: 'build/' },
    ],
    verbose: true,
  }),
  terser(),
]

export default {
  input,
  output: {
    file: 'build/index.js',
    format: 'umd',
    name,
    globals,
  },
  plugins,
}
