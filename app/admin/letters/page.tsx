import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Search, Eye, Edit, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { LettersSearchParams } from "@/types"

interface LettersPageProps {
  searchParams: LettersSearchParams
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending_review", label: "Pending Review" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" }
]

const getStatusBadge = (status: string) => {
  const statusConfig = {
    draft: { variant: "secondary" as const, icon: Clock, label: "Draft" },
    generating: { variant: "secondary" as const, icon: Clock, label: "Generating" },
    pending_review: { variant: "default" as const, icon: AlertCircle, label: "Pending Review" },
    under_review: { variant: "secondary" as const, icon: Clock, label: "Under Review" },
    approved: { variant: "default" as const, icon: CheckCircle, label: "Approved" },
    completed: { variant: "default" as const, icon: CheckCircle, label: "Completed" },
    rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejected" }
  }
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

export default async function LettersPage({ searchParams }: LettersPageProps) {
  const supabase = await createClient()
  const status = searchParams.status || "all"
  const search = searchParams.search || ""

  // Build query
  let query = supabase
    .from("letters")
    .select(`
      *,
      profiles!inner(
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false })

  // Apply status filter
  if (status !== "all") {
    query = query.eq("status", status)
  }

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,profiles.email.ilike.%${search}%`)
  }

  const { data: letters, error } = await query

  if (error) {
    console.error("Error fetching letters:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Letter Review Center</h2>
          <p className="text-gray-600">Manage and review all letter submissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter letters by status or search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title or email..."
                  className="pl-10"
                  name="search"
                  defaultValue={search}
                />
              </div>
            </div>
            <Select name="status" defaultValue={status}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Letters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Letters</CardTitle>
          <CardDescription>
            {letters ? `${letters.length} letter${letters.length !== 1 ? 's' : ''} found` : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {letters && letters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="truncate max-w-xs">{letter.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{letter.profiles.full_name || letter.profiles.email}</p>
                        <p className="text-sm text-gray-500">{letter.profiles.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{letter.letter_type || "General"}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(letter.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(letter.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/letters/${letter.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {letter.status === "pending_review" && (
                          <Link href={`/admin/letters/${letter.id}?action=review`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No letters found</p>
              <p className="text-sm text-gray-400 mt-2">
                {search || status !== "all"
                  ? "Try adjusting your filters"
                  : "No letters have been submitted yet"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}