import { memo } from 'react'
import classNames from 'classnames'
import type { Card } from './CardTypes'
import styles from './styles.module.css'

const Card = ({ className, children, element: Element = 'div', ...rest }: Card) => (
  <Element {...rest} className={classNames(styles['card'], className)}>
    {children}
  </Element>
)

export default memo(Card)
