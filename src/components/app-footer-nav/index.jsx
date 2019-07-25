import React, { Component } from 'react'
import github from '../../assets/github/GitHub-Mark-Light-32px.png'
import {
  Keyboard
} from '@material-ui/icons'

class appFooterNav extends Component {
	constructor(props) {
		super(props)
			this.state = {
				shortcutPopupActive: false
			}

		this.switchShortcutPopupActive = this.switchShortcutPopupActive.bind(this)
		this.initEvents = this.initEvents.bind(this)
	}

	componentDidMount() {
		this.initEvents()
	}

	componentWillUnmount() {
		document.removeEventListener('closePopupShortcut')
	}

	initEvents() {
		document.addEventListener('closePopupShortcut', () => {
			this.switchShortcutPopupActive()
		})


		document.querySelector('body').onclick = (event) => {
			if (this.state.shortcutPopupActive) {
				const path = event.path

				const isClickInPopup = path.filter(element => {
					let result = false

					if (!!element.className && element.tagName !== 'svg' && element.tagName !== 'path') {
						const elementClass = element.className.split(' ')
						result = elementClass.filter(item => item === 'footer-popup-icon' || item === 'footer-popup-content').length > 0
					}

					return result
				}).length > 0

				if (!isClickInPopup) {
					document.dispatchEvent(new CustomEvent('closePopupShortcut'))
				}
			}
		}
	}

	switchShortcutPopupActive() {
		this.setState({ shortcutPopupActive: !this.state.shortcutPopupActive})
	}

	/**
	* React Render
	*/
	render() {

		const shortcutPopup = this.state.shortcutPopupActive ? (
			<div className='popup-shortcut card card-3'>
				<ul className='footer-popup-content'>
					<li><span>SpaceBar</span> Pause or resume song</li>
					<li><span>N</span> Go to the next song</li>
					<li><span>B</span> Back to the previous song</li>
				</ul>
			</div>
			) : null

		return (
			<div className='footer-nav'>
				<ul>
					<li className={this.state.shortcutPopupActive ? 'footer-popup-icon active' : null}>
						<Keyboard style={{ fontSize: '32px' }} onClick={this.switchShortcutPopupActive} />
						{shortcutPopup}
					</li>
					<li style={{ borderRadius: '12%' }}>
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

export default appFooterNav