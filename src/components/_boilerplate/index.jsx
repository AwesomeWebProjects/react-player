/**
 * dependencies
 */
import React, { Component } from 'react'
import { appContext } from 'context/app-context'
import { ReactComponent as mySVG } from 'assets/svg/my-svg.svg'

class App extends Component {
	constructor(props) {
		super(props)
		this.state = {}

		/**
		 * binded funcs
		 */
		// this.firstFunction = this.firstFunction.bind(this)
	}

	/**
	 * lifecycle
	 */

	/**
	 * funcs
	 */

	/**
	* React Render
	*/
	render() {
		/**
		 * classNames
		 */
		const _root = 'app'
		const _header = `${_root}-header`

		/**
		 * render functions
		 */
		const main = (context) => (
			<div className={_root}>
				{header()}
			</div>
		)

		const header = () => (
			<div className={_header}>
			</div>
		)

		return (
			<appContext.Consumer>
				{context => main(context)}
			</appContext.Consumer>
		)
	}
}

export default App