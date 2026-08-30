import { Cloud, FileUp, PencilLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export type ImportSource = 'manual' | 'edgetx' | 'vbar'

interface SourcePickerProps {
  onSelect: (source: ImportSource) => void
}

const SOURCES: { source: ImportSource; icon: LucideIcon; title: string; description: string }[] = [
  {
    source: 'manual',
    icon: PencilLine,
    title: 'Manual entry',
    description: 'Type in a single flight — model, date and duration.',
  },
  {
    source: 'edgetx',
    icon: FileUp,
    title: 'EdgeTX logs',
    description: 'Drop CSV log files (or a whole logs folder) from your radio SD card.',
  },
  {
    source: 'vbar',
    icon: Cloud,
    title: 'VBar Cloud',
    description: 'Pull your flights straight from vstabi.info with your account login.',
  },
]

export default function SourcePicker({ onSelect }: SourcePickerProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SOURCES.map(({ source, icon: Icon, title, description }) => (
        <Card
          key={source}
          className="cursor-pointer transition-colors hover:border-brand-sky"
          onClick={() => onSelect(source)}
        >
          <CardContent className="flex flex-col gap-2 p-4">
            <Icon className="size-5 text-brand-sky" />
            <p className="text-sm font-bold">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
