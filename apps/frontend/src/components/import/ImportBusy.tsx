import { Loader2 } from 'lucide-react'

interface ImportBusyProps {
  message: string
}

export default function ImportBusy({ message }: ImportBusyProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Loader2 className="size-8 animate-spin text-brand-sky" />
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
  )
}
