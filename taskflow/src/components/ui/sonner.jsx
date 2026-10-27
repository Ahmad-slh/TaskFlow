import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from '@/context/LanguageContext'

function Toaster(props) {
  const { resolved } = useTheme()
  const { dir } = useTranslation()
  return (
    <SonnerToaster
      position="top-center"
      theme={resolved}
      dir={dir}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-sans',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from 'sonner'
