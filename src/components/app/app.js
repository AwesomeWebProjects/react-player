import React, { Component } from 'react';
import Audio from '../audio/component';
import FooterNav from '../footer-nav/component';

class App extends Component {
  render() {
    return [
      <Audio key='audio-component' />,
      <FooterNav key='footer-nav' />
    ]
  }
}

export default App;
