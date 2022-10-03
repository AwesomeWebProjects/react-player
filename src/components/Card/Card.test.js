/* eslint-env jest */

import React from 'react'
import renderer from 'react-test-renderer'
import Card from './index'

test('Card: simple render test', () => {
  const component = renderer.create(
    <Card>
      <p>
        middle skin live grabbed daughter wish page apart influence breathing which friendly getting
        laid difficulty cut specific curious indeed third coat right forty shorter
      </p>
      <p>
        middle skin live grabbed daughter wish page apart influence breathing which friendly getting
        laid difficulty cut specific curious indeed third coat right forty shorter
      </p>
    </Card>,
  )

  const tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})
