import { useRef, useState } from 'react'
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Paperclip,
  Upload,
  Download,
  Play,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Send,
  Pencil,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import {
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
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
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
        className="h-8 w-24"
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

  if (isLoading) {
    return <TicketDetailSkeleton />
  }

  if (isError || !ticket) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <p className="font-medium">{t('ticketDetail.notFoundTitle')}</p>
          <p className="text-sm text-muted-foreground">
            {t('ticketDetail.notFoundSubtitle')}
          </p>
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

  async function handleStatusChange(status) {
    try {
      await updateStatus.mutateAsync({ ticketId: ticket.id, status })
      toast.success(t('ticketDetail.statusUpdated', { status: t(`status.${status}`) }))
    } catch (error) {
      toast.error(friendlyError(error, t('ticketDetail.statusFailed')))
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await uploadAttachment.mutateAsync({ ticketId: ticket.id, file })
      toast.success(t('ticketDetail.fileUploaded'))
    } catch (error) {
      toast.error(friendlyError(error, t('ticketDetail.uploadFailed')))
    }
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

  // Developer status transitions.
  const devAction = (() => {
    if (!isAssignee) return null
    switch (ticket.status) {
      case 'Open':
      case 'Reopened':
        return { labelKey: 'ticketDetail.startWorking', next: 'In Progress', icon: Play }
      case 'In Progress':
        return { labelKey: 'ticketDetail.markAsDone', next: 'Done', icon: CheckCircle2 }
      case 'Done':
        return { labelKey: 'ticketDetail.reopen', next: 'Reopened', icon: RotateCcw }
      default:
        return null
    }
  })()

  const canCancel = isCreator && ['Open', 'Reopened'].includes(ticket.status)
  const canUpload = isCreator || isAssignee
  const canEdit = isCreator && !['Done', 'Cancelled'].includes(ticket.status)
  const overdue = isOverdue(ticket)
  const actualTime =
    ticket.status === 'Done' ? formatDurationShort(ticket.started_at, ticket.closed_at) : null

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="ltr:-ml-2 rtl:-mr-2"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('ticketDetail.back')}
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
              {ticket.ticket_number}
            </div>
            <h1 className="text-2xl font-semibold">{ticket.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={ticket.type} />
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </div>

          <Card>
            <CardContent className="p-5">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MetaItem label={t('ticketDetail.createdBy')} value={ticket.creator?.name || '—'} />
                <MetaItem label={t('ticketDetail.assignedTo')} value={ticket.assignee?.name || '—'} />
                <MetaItem label={t('ticketDetail.created')} value={formatDate(ticket.created_at)} />
                <MetaItem label={t('ticketDetail.updated')} value={formatDate(ticket.updated_at)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('ticketDetail.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  {t('ticketDetail.attachments')}
                </span>
              </CardTitle>
              {canUpload && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadAttachment.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadAttachment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {t('ticketDetail.upload')}
                  </Button>
                </>
              )}
            </CardHeader>
            <CardContent>
              {ticket.attachments?.length ? (
                <ul className="space-y-2">
                  {ticket.attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="truncate text-sm">{file.file_name}</span>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
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
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('ticketDetail.comments')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length ? (
                <ul className="space-y-4">
                  {comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                          {getInitials(c.commenter?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {c.commenter?.name || t('common.unknown')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(c.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
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
            </CardContent>
          </Card>

          <ActivityTimeline ticketId={ticket.id} />
        </div>

        {/* Right column — action panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('ticketDetail.status')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusBadge status={ticket.status} className="text-sm" />

              {devAction && (
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
              )}

              {canCancel && (
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
                      <AlertDialogDescription>
                        {t('ticketDetail.cancelDescription')}
                      </AlertDialogDescription>
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
              )}

              {canEdit && (
                <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  {t('ticketDetail.edit')}
                </Button>
              )}

              {!devAction && !canCancel && !canEdit && (
                <p className="text-sm text-muted-foreground">
                  {t('ticketDetail.noActions')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('ticketDetail.ticketInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <MetaItem label={t('ticketDetail.type')} value={<TypeBadge type={ticket.type} />} />
                <MetaItem
                  label={t('ticketDetail.priority')}
                  value={<PriorityBadge priority={ticket.priority} />}
                />
                <MetaItem
                  label={t('ticketDetail.customer')}
                  value={
                    ticket.customer ? (
                      role === 'employee' ? (
                        <Link to={`/customers/${ticket.customer.id}`} className="text-primary hover:underline">
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
                    <span className={overdue ? 'text-destructive' : undefined}>
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
                {actualTime && (
                  <MetaItem label={t('ticketDetail.actualTime')} value={actualTime} />
                )}
                <MetaItem label={t('ticketDetail.created')} value={formatDate(ticket.created_at)} />
                {ticket.closed_at && (
                  <MetaItem label={t('ticketDetail.closed')} value={formatDate(ticket.closed_at)} />
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {canEdit && <EditTicketDialog open={editing} onOpenChange={setEditing} ticket={ticket} />}
    </div>
  )
}

function TicketDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}
