import React, { Component } from 'react';
import Audio from '../audio/component';
import github from '../../assets/github/GitHub-Mark-Light-32px.png'

class App extends Component {
  render() {
    return [
      <Audio key='audio-component' />,
      <div key='github-logo'>
        <a href='https://github.com/danielbarion/react-player' target='_alt' title='GitHub Repository'>
          <img src={github} alt='GitHub' width='32' height='32' style={{'position': 'absolute', 'right': '2rem', 'bottom': '2rem'}}></img>
        </a>
      </div>
    ]
  }
}

export default App;
