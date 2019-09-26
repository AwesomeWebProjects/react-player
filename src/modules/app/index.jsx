/**
 * dependencies
 */
import React, { Component } from 'react'
import { appContext } from 'context/app-context'
import Audio from 'components/audio'
import AppFooterNav from 'components/app-footer-nav'
import AppVersion from 'components/app-version'

/**
 * music
 */
import rise from 'assets/music/rise.mp3'
import fantastic from 'assets/music/fantastic.mp3'
import legendsNeverDie from 'assets/music/legends-never-die.mp3'
import shortLegendsNeverDie from 'assets/music/short-legends-never-die.mp3'

class App extends Component {
	constructor(props) {
		super(props)

		/**
		 * state
		 */
		this.state = {
			tracks: [
				{
					name: 'Small Piece of music LND',
					artist: 'League of Legends',
					url: shortLegendsNeverDie
				},
				{
					name: 'Legends Never Die',
					artist: 'League of Legends',
					url: legendsNeverDie
				},
				{
					name: 'Rise',
					artist: 'League of Legends',
					url: rise
				},
				{
					name: 'Fantastic - Cinematic Sound',
					artist: 'AudioJungle',
					url: fantastic
				},
			]
		}
	}

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
				<Audio key='audio-component'
					tracks={this.state.tracks}
					thread='worker'
				/>
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