import React, { Component } from 'react'

class appVersion extends Component {
	constructor(props) {
		super(props)
			this.state = {
				version: require('../../../package.json').version || '0.0.0'
			}
	}

	/**
	* React Render
	*/
	render() {

		return (
			<div className='version'>
				{this.state.version}
			</div>
		)
	}
}

export default appVersion