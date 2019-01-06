import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ParticleEffectButton from 'react-particle-effect-button'

class ParticleButton extends Component {
  static propTypes = {
    background: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    buttonStyles: PropTypes.object.isRequired,
    buttonOptions: PropTypes.object.isRequired
  }

  state = {
    hidden: false,
    animating: false,
    resetButton: this.props.resetButton || false,
    onStartAnimation: this.props.onStartAnimation || null,
    onFinishAnimation: this.props.onFinishAnimation || null,
    hideComponent: false
  }

  render() {
    const {
      text,
      buttonStyles,
      buttonOptions
    } = this.props

    const {
      hidden,
      animating,
      resetButton,
      hideComponent
    } = this.state

    return (
      <div
        style={{
          position: !hideComponent ? 'relative' : 'absolute',
          display: !hideComponent ? 'flex' : 'hidden',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
        {hidden && !animating && resetButton && (
          <button
            style={{
              position: 'absolute',
              top: '1em',
              right: '1em',
              background: '#32bafa',
              color: '#fff',
              border: '0',
              borderRadius: 4,
              fontSize: '1em',
              padding: '0.7em 1.2em',
              cursor: 'pointer',
              outline: 'none'
            }}
            onClick={this._onToggle}>
            Reset
          </button>
        )}

        <ParticleEffectButton
          hidden={hidden}
          onBegin={this._onAnimationBegin}
          onComplete={this._onAnimationComplete}
          {...buttonOptions}>
          <button
            style={{
              background: '#121019',
              color: '#fff',
              padding: '1.5rem 3rem',
              border: '0',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: '1.2em',
              ...buttonStyles
            }}
            onClick={this._onToggle}>
            {text}
          </button>
        </ParticleEffectButton>
      </div>
    )
  }

  _onToggle = () => {
    if (this.state.animating) return

    this.setState({
      hidden: !this.state.hidden,
      animating: true,
    })
  }

  _onAnimationComplete = () => {
    this.setState({
      animating: false,
      hideComponent: true
    })

    if (this.onFinishAnimation !== null) {
      this.props.onFinishAnimation()
    }
  }

  _onAnimationBegin = () => {
    if (this.onStartAnimation !== null) {
      this.props.onStartAnimation()
    }
  }

}

export default ParticleButton;