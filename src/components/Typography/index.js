import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import style from './style.module.css'

const Typography = ({ className, children, innerHTML, variant, element }) => {
  const typographyClassNames = classNames(style.typography, className, style[variant])

  const elementMap = {
    displayXXL: 'h1',
    displayXL: 'h2',
    displayL: 'h3',
    displayM: 'h4',
    displayS: 'h5',
    subtitle: 'h6',
    bodyL: 'p',
    buttonM: 'span',
    bodyM: 'p',
    buttonS: 'span',
    bodyS: 'p',
    cardContent: 'p',
    buttonXS: 'span',
    bodyXS: 'p',
    buttonXXS: 'p',
  }

  const TypographyElement = element || elementMap[variant]

  if (innerHTML) {
    return (
      <TypographyElement
        className={typographyClassNames}
        dangerouslySetInnerHTML={{ __html: innerHTML }}
      />
    )
  }

  return <TypographyElement className={typographyClassNames}>{children}</TypographyElement>
}

Typography.propTypes = {
  className: PropTypes.string,
  element: PropTypes.string,
  variant: PropTypes.oneOf([
    'displayXXL',
    'displayXL',
    'displayL',
    'displayM',
    'displayS',
    'subtitle',
    'bodyL',
    'buttonM',
    'bodyM',
    'buttonS',
    'bodyS',
    'cardContent',
    'buttonXS',
    'bodyXS',
    'buttonXXS',
  ]),
  innerHTML: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.node,
    PropTypes.object,
  ]),
}

Typography.defaultProps = {
  className: null,
  element: null,
  innerHTML: null,
  children: null,
  variant: 'bodyS',
}

export default Typography
