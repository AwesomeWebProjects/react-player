import React from 'react'
import ReactDOM from 'react-dom'
import 'assets/css/base.styl'
import App from 'modules/app'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import MyAppContext from 'context/app-context'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(
	<MyAppContext>
		<BrowserRouter>
			<Switch>
				<Route path='/' exact={true} component={App} />
				{/* <Route path='/app' component={App} /> */}
				<Route path='*' component={App} />
			</Switch>
		</ BrowserRouter>
	</MyAppContext>
	, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
