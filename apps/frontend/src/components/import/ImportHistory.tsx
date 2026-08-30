import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Trash2 } from 'lucide-react'
import { importApi, importKeys } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import VbarCredentialsForm from './VbarCredentialsForm'
import { invalidateImportData } from './invalidate'

export default function ImportHistory() {
  const queryClient = useQueryClient()
  const [reimportId, setReimportId] = useState<number | null>(null)

  const importsQuery = useQuery({ queryKey: importKeys.all, queryFn: importApi.list })

  const deleteMut = useMutation({
    mutationFn: (id: number) => importApi.remove(id),
    onSuccess: () => invalidateImportData(queryClient),
  })

  const reimportMut = useMutation({
    mutationFn: (id: number) => importApi.reimport(id),
    onSuccess: () => invalidateImportData(queryClient),
  })

  const imports = importsQuery.data ?? []
  if (importsQuery.isPending || imports.length === 0) return null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Previous imports
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-widest">Source</TableHead>
              <TableHead className="text-xs uppercase tracking-widest">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-widest">Flights</TableHead>
              <TableHead className="text-xs uppercase tracking-widest">Models</TableHead>
              <TableHead className="text-xs uppercase tracking-widest" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {imports.map((imp) => (
              <Fragment key={imp.id}>
                <TableRow>
                  <TableCell>
                    <Badge variant="outline">{imp.format}</Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {formatDateTime(imp.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{imp.counts.flights}</TableCell>
                  <TableCell className="text-sm tabular-nums">{imp.counts.models}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Re-import"
                        disabled={reimportMut.isPending || deleteMut.isPending}
                        onClick={() => {
                          if (imp.format === 'vbar_v2') {
                            setReimportId((cur) => (cur === imp.id ? null : imp.id))
                          } else {
                            reimportMut.mutate(imp.id)
                          }
                        }}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete import"
                        disabled={reimportMut.isPending || deleteMut.isPending}
                        onClick={() => {
                          if (window.confirm('Delete this import and all flights it created?')) {
                            deleteMut.mutate(imp.id)
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {reimportId === imp.id && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-muted/40">
                      <VbarCredentialsForm
                        submitLabel="Re-import"
                        onSubmit={(creds) =>
                          importApi.reimport(imp.id, {
                            username: creds.username,
                            password: creds.password,
                          })
                        }
                        onDone={() => {
                          setReimportId(null)
                          invalidateImportData(queryClient)
                        }}
                        onCancel={() => setReimportId(null)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
        {(deleteMut.error || reimportMut.error) && (
          <p className="p-4 text-sm text-brand-punch">
            {(deleteMut.error ?? reimportMut.error)?.message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
