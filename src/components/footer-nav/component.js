import React, { Component } from 'react'
import './style.css'
import github from '../../assets/github/GitHub-Mark-Light-32px.png'
import {
  Keyboard
} from '@material-ui/icons'

class footerNav extends Component {
	constructor(props) {
		super(props)
			this.state = {
				shortcutPopupActive: false
			}
		this.switchShortcutPopupActive = this.switchShortcutPopupActive.bind(this)
	}

	switchShortcutPopupActive() {
		this.setState({ shortcutPopupActive: !this.state.shortcutPopupActive})
	}

	/**
	* React Render
	*/
	render() {

		const shortcutPopup = this.state.shortcutPopupActive ? (
			<div className='popup-shortcut card card-4'>
				<ul>
					<li><span>SpaceBar</span> Pause or resume song</li>
					<li><span>N</span> Go to the next song</li>
					<li><span>B</span> Back to the previous song</li>
				</ul>
			</div>
			) : null

		return (
			<div className='footer-nav'>
				<ul>
					<li onClick={this.switchShortcutPopupActive} className={this.state.shortcutPopupActive ? 'active' : null}>
						<Keyboard	style={{ fontSize: '32px' }} />
						{shortcutPopup}
					</li>
					<li>
						<div key='github-logo' data-for='githubTooltip' data-tip>
							<a href='https://github.com/danielbarion/react-player' target='_alt'>
								<img src={github} alt='GitHub' width='32' height='32'></img>
							</a>
						</div>
					</li>
				</ul>
			</div>
		)
	}
}

export default footerNav