/**
 * dependencies
 */
import React, { Component } from 'react'
import { appContext } from 'context/app-context'
import Audio from 'components/audio'
import AppFooterNav from 'components/app-footer-nav'
import AppVersion from 'components/app-version'

class App extends Component {

	/**
	* React Render
	*/
	render() {
		/**
		 * classNames
		 */
		const _root = 'app'

		/**
		 * render functions
		 */
		const main = () => (
			<div className={_root}>
				<Audio key='audio-component' />
				<AppFooterNav key='app-footer-nav' />
				<AppVersion key='app-version' />
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