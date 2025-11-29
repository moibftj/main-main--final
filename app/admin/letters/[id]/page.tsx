import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  Eye,
  User,
  Mail,
  Calendar,
  FileText
} from "lucide-react"
import Link from "next/link"
import { LetterReviewInterface } from "@/components/admin/letter-review-interface"

interface LetterPageProps {
  params: { id: string }
  searchParams: { action?: string }
}

export default async function LetterReviewPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Fetch letter with user details
  const { data: letter, error } = await supabase
    .from("letters")
    .select(`
      *,
      profiles!letters_user_id_fkey (
        email,
        full_name,
        phone,
        company_name
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !letter) {
    notFound()
  }

  // Fetch audit trail for this letter
  const { data: auditTrail } = await supabase
    .from("letter_audit_trail")
    .select("*")
    .eq("letter_id", params.id)
    .order("created_at", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/letters">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Letters
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{letter.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={
                letter.status === "completed" ? "default" :
                letter.status === "approved" ? "default" :
                letter.status === "rejected" ? "destructive" :
                letter.status === "pending_review" ? "secondary" :
                "secondary"
              }>
                {letter.status.replace("_", " ").toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-500">
                ID: {letter.id.slice(0, 8)}...{letter.id.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Letter Information Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <LetterReviewInterface
            letter={letter}
            auditTrail={auditTrail || []}
          />
        </div>

        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Submitted By
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Name</Label>
                <p className="font-medium">
                  {letter.profiles.full_name || "Not provided"}
                </p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="font-medium text-sm">{letter.profiles.email}</p>
              </div>
              <div>
                <Label>Phone</Label>
                <p className="font-medium">
                  {letter.profiles.phone || "Not provided"}
                </p>
              </div>
              <div>
                <Label>Company</Label>
                <p className="font-medium">
                  {letter.profiles.company_name || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Letter Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Letter Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Type</Label>
                <p className="font-medium">{letter.letter_type || "General Letter"}</p>
              </div>
              <div>
                <Label>Created</Label>
                <p className="font-medium text-sm">
                  {new Date(letter.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label>Last Updated</Label>
                <p className="font-medium text-sm">
                  {new Date(letter.updated_at).toLocaleDateString()}
                </p>
              </div>
              {letter.completed_at && (
                <div>
                  <Label>Completed</Label>
                  <p className="font-medium text-sm">
                    {new Date(letter.completed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Information */}
          {(letter.reviewed_by || letter.review_notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Review Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {letter.reviewed_at && (
                  <div>
                    <Label>Reviewed Date</Label>
                    <p className="font-medium text-sm">
                      {new Date(letter.reviewed_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {letter.review_notes && (
                  <div>
                    <Label>Review Notes</Label>
                    <p className="text-sm">{letter.review_notes}</p>
                  </div>
                )}
                {letter.rejection_reason && (
                  <div>
                    <Label>Rejection Reason</Label>
                    <p className="text-sm text-red-600">{letter.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}