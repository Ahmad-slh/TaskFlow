import { useRef, useState } from 'react'
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Paperclip,
  Upload,
  Download,
  XCircle,
  Send,
  Pencil,
  AlarmClock,
  MessageSquare,
  History,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { TypeBadge } from '@/components/tickets/TypeBadge'
import { EditTicketDialog } from '@/components/tickets/EditTicketDialog'
import { ActivityTimeline } from '@/components/tickets/ActivityTimeline'
import {
  useTicket,
  useUpdateTicket,
  useUpdateTicketStatus,
  useUploadAttachment,
} from '@/hooks/useTickets'
import { useAddComment } from '@/hooks/useComments'
import { useNow } from '@/hooks/useNow'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { developerAction } from '@/lib/ticketTransitions'
import {
  cn,
  formatDate,
  formatDay,
  formatDurationShort,
  getInitials,
  timeAgo,
  friendlyError,
  isOverdue,
} from '@/lib/utils'

function MetaItem({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-end text-sm font-medium">{value}</dd>
    </div>
  )
}

/** Lets the assignee set / adjust the estimated hours. */
function EstimateEditor({ ticket }) {
  const { t } = useTranslation()
  const updateTicket = useUpdateTicket()
  const [value, setValue] = useState(ticket.estimated_hours ?? '')

  async function save() {
    const hours = String(value).trim()
    if (hours !== '' && (!Number.isFinite(Number(hours)) || Number(hours) < 0)) {
      toast.error(t('createTicket.estimatedHoursInvalid'))
      return
    }
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        values: { estimated_hours: hours },
      })
      toast.success(t('ticketDetail.updatedOk'))
    } catch (error) {
      toast.error(friendlyError(error, t('ticketDetail.updateFailed')))
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        step="0.25"
        className="h-8 w-20"
        aria-label={t('ticketDetail.estimatedHours')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button size="sm" variant="outline" disabled={updateTicket.isPending} onClick={save}>
        {updateTicket.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {t('ticketDetail.setEstimate')}
      </Button>
    </div>
  )
}

/** Elapsed work time compared with the estimate. */
function TimeProgress({ ticket }) {
  const { t } = useTranslation()
  const now = useNow()

  if (!ticket.started_at) {
    return <p className="text-sm text-muted-foreground">{t('ticketDetail.notStarted')}</p>
  }

  const end = ticket.status === 'Done' && ticket.closed_at ? ticket.closed_at : now
  const elapsedMs = Math.max(0, new Date(end) - new Date(ticket.started_at))
  const estimateMs = ticket.estimated_hours != null ? Number(ticket.estimated_hours) * 3600_000 : 0
  const ratio = estimateMs > 0 ? elapsedMs / estimateMs : 0
  const over = estimateMs > 0 && ratio > 1

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{t('ticketDetail.elapsed')}</span>
        <span className="font-semibold">{formatDurationShort(ticket.started_at, end)}</span>
      </div>
      {estimateMs > 0 && (
        <>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, Math.round(ratio * 100))}
            aria-label={t('ticketDetail.timeProgress')}
          >
            <div
              className={cn('h-full rounded-full transition-all', over ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('ticketDetail.hours', { n: ticket.estimated_hours })}</span>
            {over && <span className="font-semibold text-destructive">{t('ticketDetail.overEstimate')}</span>}
          </div>
        </>
      )}
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { t } = useTranslation()
  const { data: ticket, isLoading, isError } = useTicket(id)

  const updateStatus = useUpdateTicketStatus()
  const uploadAttachment = useUploadAttachment()
  const addComment = useAddComment()

  const fileInputRef = useRef(null)
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState('comments')
  const [dragOver, setDragOver] = useState(false)

  if (isLoading) {
    return <TicketDetailSkeleton />
  }

  if (isError || !ticket) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <p className="font-medium">{t('ticketDetail.notFoundTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('ticketDetail.notFoundSubtitle')}</p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            {t('ticketDetail.backToDashboard')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isCreator = ticket.created_by === user?.id
  const isAssignee = ticket.assigned_to === user?.id

  // Client-side guard on top of RLS.
  if (!isCreator && !isAssignee) {
    return <Navigate to="/dashboard" replace />
  }

  const comments = [...(ticket.comments ?? [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )
  const attachments = ticket.attachments ?? []

  async function handleStatusChange(status) {
    try {
      await updateStatus.mutateAsync({ ticketId: ticket.id, status })
      toast.success(t('ticketDetail.statusUpdated', { status: t(`status.${status}`) }))
    } catch (error) {
      toast.error(friendlyError(error, t('ticketDetail.statusFailed')))
    }
  }

  async function uploadFile(file) {
    if (!file) return
    try {
      await uploadAttachment.mutateAsync({ ticketId: ticket.id, file })
      toast.success(t('ticketDetail.fileUploaded'))
    } catch (error) {
      toast.error(friendlyError(error, t('ticketDetail.uploadFailed')))
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    uploadFile(file)
  }

  async function handleAddComment(e) {
    e.preventDefault()
    const message = comment.trim()
    if (!message) return
    try {
      await addComment.mutateAsync({ ticketId: ticket.id, message })
      setComment('')
    } catch (error) {
      toast.error(friendlyError(error, t('ticketDetail.commentFailed')))
    }
  }

  // Developer status transitions (shared with the Kanban board).
  const devAction = isAssignee ? developerAction(ticket.status) : null
  const canCancel = isCreator && ['Open', 'Reopened'].includes(ticket.status)
  const canUpload = isCreator || isAssignee
  const canEdit = isCreator && !['Done', 'Cancelled'].includes(ticket.status)
  const overdue = isOverdue(ticket)
  const hasActions = !!devAction || canEdit || canCancel

  const primaryAction = devAction && (
    <Button
      className="w-full"
      disabled={updateStatus.isPending}
      onClick={() => handleStatusChange(devAction.next)}
    >
      {updateStatus.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <devAction.icon className="h-4 w-4" />
      )}
      {t(devAction.labelKey)}
    </Button>
  )

  const cancelDialog = canCancel && (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full text-destructive">
          <XCircle className="h-4 w-4" />
          {t('ticketDetail.cancelTicket')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('ticketDetail.cancelTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('ticketDetail.cancelDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('ticketDetail.keepTicket')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => handleStatusChange('Cancelled')}
          >
            {t('ticketDetail.cancelTicket')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <div className={cn('space-y-6', hasActions && 'pb-24 lg:pb-0')}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="ltr:-ml-2 rtl:-mr-2"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('ticketDetail.back')}
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
            {ticket.ticket_number}
          </span>
          <TypeBadge type={ticket.type} />
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          {overdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-tone-red-bg px-2.5 py-0.5 text-xs font-semibold text-tone-red-fg">
              <AlarmClock className="h-3 w-3" aria-hidden="true" />
              {t('ticketDetail.overdue')}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{ticket.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('ticketDetail.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <Tabs value={tab} onValueChange={setTab}>
              <div className="overflow-x-auto p-3 pb-0">
                <TabsList>
                  <TabsTrigger value="comments">
                    <MessageSquare />
                    {t('ticketDetail.comments')}
                    <span className="text-xs text-muted-foreground">{comments.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    <History />
                    {t('ticketDetail.activity')}
                  </TabsTrigger>
                  <TabsTrigger value="attachments">
                    <Paperclip />
                    {t('ticketDetail.attachments')}
                    <span className="text-xs text-muted-foreground">{attachments.length}</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="comments" className="space-y-4 p-5">
                {comments.length ? (
                  <ul className="space-y-4">
                    {comments.map((c) => (
                      <li key={c.id} className="flex gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(c.commenter?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 rounded-xl rounded-ss-none bg-muted/60 px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {c.commenter?.name || t('common.unknown')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(c.created_at)}
                            </span>
                          </div>
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">
                            {c.message}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('ticketDetail.noComments')}</p>
                )}

                <Separator />

                <form onSubmit={handleAddComment} className="space-y-2">
                  <Textarea
                    placeholder={t('ticketDetail.commentPlaceholder')}
                    aria-label={t('ticketDetail.commentPlaceholder')}
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={addComment.isPending || !comment.trim()}>
                      {addComment.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 rtl:rotate-180" />
                      )}
                      {t('ticketDetail.addComment')}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="activity" className="p-5">
                <ActivityTimeline ticketId={ticket.id} bare />
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4 p-5">
                {canUpload && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      disabled={uploadAttachment.isPending}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOver(true)
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        uploadFile(e.dataTransfer.files?.[0])
                      }}
                      className={cn(
                        'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60',
                        dragOver && 'border-primary bg-primary/5'
                      )}
                    >
                      {uploadAttachment.isPending ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
                      )}
                      <span className="text-sm font-semibold">{t('ticketDetail.dropFiles')}</span>
                      <span className="text-xs text-muted-foreground">
                        {t('ticketDetail.dropFilesHint')}
                      </span>
                    </button>
                  </>
                )}

                {attachments.length ? (
                  <ul className="space-y-2">
                    {attachments.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-sm">
                          <Paperclip
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="truncate">{file.file_name}</span>
                        </span>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          <Download className="h-4 w-4" />
                          {t('ticketDetail.download')}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('ticketDetail.noAttachments')}</p>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {hasActions && (
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-base">{t('ticketDetail.actionsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {primaryAction}
                {canEdit && (
                  <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
                    <Pencil className="h-4 w-4" />
                    {t('ticketDetail.edit')}
                  </Button>
                )}
                {cancelDialog}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('ticketDetail.detailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <MetaItem label={t('ticketDetail.createdBy')} value={ticket.creator?.name || '—'} />
                <MetaItem
                  label={t('ticketDetail.assignedTo')}
                  value={ticket.assignee?.name || '—'}
                />
                <MetaItem
                  label={t('ticketDetail.customer')}
                  value={
                    ticket.customer ? (
                      role === 'employee' ? (
                        <Link
                          to={`/customers/${ticket.customer.id}`}
                          className="text-primary hover:underline"
                        >
                          {ticket.customer.name}
                        </Link>
                      ) : (
                        ticket.customer.name
                      )
                    ) : (
                      '—'
                    )
                  }
                />
                <MetaItem
                  label={t('ticketDetail.dueDate')}
                  value={
                    <span className={overdue ? 'font-semibold text-destructive' : undefined}>
                      {formatDay(ticket.due_date)}
                      {overdue && ` (${t('ticketDetail.overdue')})`}
                    </span>
                  }
                />
                <MetaItem
                  label={t('ticketDetail.estimatedHours')}
                  value={
                    isAssignee && !['Done', 'Cancelled'].includes(ticket.status) ? (
                      <EstimateEditor key={ticket.estimated_hours ?? 'none'} ticket={ticket} />
                    ) : ticket.estimated_hours != null ? (
                      t('ticketDetail.hours', { n: ticket.estimated_hours })
                    ) : (
                      '—'
                    )
                  }
                />
                <MetaItem label={t('ticketDetail.created')} value={formatDate(ticket.created_at)} />
                <MetaItem label={t('ticketDetail.updated')} value={formatDate(ticket.updated_at)} />
                {ticket.closed_at && (
                  <MetaItem label={t('ticketDetail.closed')} value={formatDate(ticket.closed_at)} />
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('ticketDetail.timeProgress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeProgress ticket={ticket} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile action bar */}
      {hasActions && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card/95 p-3 backdrop-blur lg:hidden">
          {primaryAction}
          {canEdit && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setEditing(true)}
              aria-label={t('ticketDetail.edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {!devAction && cancelDialog}
        </div>
      )}

      {canEdit && <EditTicketDialog open={editing} onOpenChange={setEditing} ticket={ticket} />}
    </div>
  )
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-24" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-9 w-2/3" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  )
}
