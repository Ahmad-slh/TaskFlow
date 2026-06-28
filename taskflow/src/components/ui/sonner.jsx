import { Toaster as SonnerToaster } from 'sonner'

function Toaster(props) {
  return (
    <SonnerToaster
      position="top-right"
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
