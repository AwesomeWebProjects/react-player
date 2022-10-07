import type { ElementType, ReactNode } from 'react'

export interface Card {
  className?: string
  element?: ElementType
  children: Element | ElementType | ReactNode
}

