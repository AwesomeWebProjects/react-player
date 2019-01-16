import React, { Component } from 'react'
import './style.css'
import github from '../../assets/github/GitHub-Mark-Light-32px.png'
import {
  Keyboard
} from '@material-ui/icons'

class footerNav extends Component {
	constructor(props) {
		super(props)
			this.state = {}
	}

	/**
	* React Render
	*/
	render() {
		return (
			<div className="footer-nav">
				<ul>
					<li>
						<Keyboard	style={{ fontSize: '32px' }} />
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