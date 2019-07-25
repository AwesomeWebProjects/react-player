import React, { Component, createContext } from 'react'

export const appContext = createContext()

class appProvider extends Component {
  constructor(props) {
    super(props)
    /**
     * state
     */
    this.state = {}
  }

	/**
	 * React Render
	 */
  render() {
    return (
      <appContext.Provider value={{}}>
        { this.props.children }
      </appContext.Provider>
    )
  }
}

export default appProvider