import { memo } from 'react'
import { AppGlobalStateProvider } from '../../contexts/AppContext'
import { Controller } from '../Controller'

const Provider = ({ ...rest }) => {
  return (
    <AppGlobalStateProvider>
      <Controller {...rest} />
    </AppGlobalStateProvider>
  )
}

export default memo(Provider)
