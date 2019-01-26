import React, { Component } from 'react'
import Audio from '../audio/component'
import AppFooterNav from '../app-footer-nav/component'
import AppVersion from '../app-version/component'

class App extends Component {
  render() {
    return [
      <Audio key='audio-component' />,
      <AppFooterNav key='app-footer-nav' />,
      <AppVersion key='app-version' />
    ]
  }
}

export default App;
