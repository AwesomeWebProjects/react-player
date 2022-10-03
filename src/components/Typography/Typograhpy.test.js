/* eslint-env jest */

import React from 'react'
import renderer from 'react-test-renderer'
import Typography from './index'

test('Typograpy: simple render test', () => {
  const component = renderer.create(<Typography>Hello worldddd</Typography>)

  const tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})
