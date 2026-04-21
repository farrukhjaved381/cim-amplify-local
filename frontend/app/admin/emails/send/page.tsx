"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AdminProtectedRoute } from "@/components/admin/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Mail, Send, ArrowLeft, AlertCircle, Plus, X, FileText, Users, User, Clock, Eye, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";

const EMAIL_TEMPLATES = [
  {
    value: "advisor-monthly",
    label: "Advisor Monthly Report",
    description: "Comprehensive monthly report showing deal activity, buyer interest, and movement tracking for advisors/sellers",
    icon: Users,
    category: "advisor",
    frequency: "Monthly",
    recipientType: "advisors",
    details: "Includes active deals, new buyer interest, buyer movements, and performance metrics"
  },
  {
    value: "buyer-monthly",
    label: "Buyer Monthly Report",
    description: "Monthly activity summary showing deal progress, new opportunities, and pending introductions for buyers",
    icon: User,
    category: "buyer",
    frequency: "Monthly",
    recipientType: "buyers",
    details: "Shows active deals, new pending deals, deal progress, and time tracking"
  },
  {
    value: "semiannual-buyer-reminder",
    label: "Semi-Annual Buyer Reminder",
    description: "Reminder email encouraging buyers to update their target criteria and deal preferences",
    icon: Clock,
    category: "buyer",
    frequency: "Semi-Annual",
    recipientType: "buyers",
    details: "Prompts buyers to review and update their company profile and investment criteria"
  },
  {
    value: "introduction-followup",
    label: "Introduction Follow-Up",
    description: "Automated follow-up emails sent 3 days after introductions to check connection status",
    icon: Mail,
    category: "both",
    frequency: "On-Demand",
    recipientType: "both",
    details: "Sends follow-up emails to both buyer and advisor asking if they've connected"
  },
];

export default function AdminSendEmailPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipientType, setRecipientType] = useState<string>("single");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientRole, setRecipientRole] = useState<string>("buyer");
  const [multipleRecipients, setMultipleRecipients] = useState<Array<{ email: string; role: string }>>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [templateType, setTemplateType] = useState<string>("");
  const [templateRecipientType, setTemplateRecipientType] = useState<string>("all-buyers");
  const [templateRecipientEmail, setTemplateRecipientEmail] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    template: any;
    recipientType: string;
    recipientEmail?: string;
    estimatedRecipients: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/admin/login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (templateType === "advisor-monthly") {
      setTemplateRecipientType("all-sellers");
    } else if (templateType === "buyer-monthly" || templateType === "semiannual-buyer-reminder") {
      setTemplateRecipientType("all-buyers");
    } else if (templateType === "introduction-followup") {
      setTemplateRecipientType("all");
    } else {
      setTemplateRecipientType("all-buyers");
    }
    setTemplateRecipientEmail("");
  }, [templateType]);

  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject and body are required",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === "single" && !recipientEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Recipient email is required for single recipient",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === "multiple" && multipleRecipients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Add at least one recipient",
        variant: "destructive",
      });
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please login again",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/mail/admin/send-custom-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientType,
          recipientEmail: recipientType === "single" ? recipientEmail : undefined,
          recipientRole: recipientType === "single" ? recipientRole : undefined,
          multipleRecipients: recipientType === "multiple" ? multipleRecipients : undefined,
          subject,
          body,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send email");
      }

      const data = await res.json();
      toast({
        title: "Success",
        description: data.message || "Email sent successfully",
      });

      setRecipientEmail("");
      setRecipientRole("buyer");
      setMultipleRecipients([]);
      setSubject("");
      setBody("");
      setRecipientType("single");
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplateEmail = async () => {
    if (!templateType) {
      toast({
        title: "Validation Error",
        description: "Please select an email template",
        variant: "destructive",
      });
      return;
    }

    if (templateRecipientType === "single" && !templateRecipientEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a recipient email",
        variant: "destructive",
      });
      return;
    }

    const buyerTemplates = ["buyer-monthly", "semiannual-buyer-reminder"];
    const advisorTemplates = ["advisor-monthly"];

    if (buyerTemplates.includes(templateType) && templateRecipientType === "all-sellers") {
      toast({
        title: "Validation Error",
        description: "This email can only be sent to buyers",
        variant: "destructive",
      });
      return;
    }

    if (advisorTemplates.includes(templateType) && templateRecipientType === "all-buyers") {
      toast({
        title: "Validation Error",
        description: "This email can only be sent to advisors/sellers",
        variant: "destructive",
      });
      return;
    }

    if (templateType === "introduction-followup" && templateRecipientType !== "all") {
      toast({
        title: "Validation Error",
        description: "Introduction follow-up emails can only be sent for all eligible introductions",
        variant: "destructive",
      });
      return;
    }

    // Calculate estimated recipients
    let estimatedRecipients = 0;
    const selectedTemplate = EMAIL_TEMPLATES.find(t => t.value === templateType);

    if (templateRecipientType === "all-buyers") {
      estimatedRecipients = 50; // Approximate
    } else if (templateRecipientType === "all-sellers") {
      estimatedRecipients = 25; // Approximate
    } else if (templateRecipientType === "all") {
      estimatedRecipients = 10; // Approximate for follow-ups
    } else if (templateRecipientType === "single") {
      estimatedRecipients = 1;
    }

    setConfirmData({
      template: selectedTemplate,
      recipientType: templateRecipientType,
      recipientEmail: templateRecipientEmail,
      estimatedRecipients,
    });
    setShowConfirmDialog(true);
  };

  const confirmSendTemplateEmail = async () => {
    if (!confirmData) return;

    setShowConfirmDialog(false);
    setLoading(true);

    const token = sessionStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please login again",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/mail/admin/send-template-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateType,
          recipientType: templateRecipientType,
          recipientEmail: templateRecipientType === "single" ? templateRecipientEmail.trim() : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send template email");
      }

      const data = await res.json();
      toast({
        title: "Success",
        description: data.message || "Template email sent successfully",
      });

      setTemplateType("");
      setTemplateRecipientType("all-buyers");
      setTemplateRecipientEmail("");
    } catch (error: any) {
      toast({
        title: "Failed to send template email",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = () => {
    if (!recipientEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Enter an email address",
        variant: "destructive",
      });
      return;
    }

    const exists = multipleRecipients.some(
      (r) => r.email === recipientEmail && r.role === recipientRole
    );

    if (exists) {
      toast({
        title: "Duplicate Entry",
        description: "This email and role combination already exists",
        variant: "destructive",
      });
      return;
    }

    setMultipleRecipients([...multipleRecipients, { email: recipientEmail, role: recipientRole }]);
    setRecipientEmail("");
    setRecipientRole("buyer");
  };

  const removeRecipient = (index: number) => {
    setMultipleRecipients(multipleRecipients.filter((_, i) => i !== index));
  };

  if (!mounted || authLoading) {
    return <div className="p-4 lg:p-6">Loading...</div>;
  }

  return (
    <AdminProtectedRoute>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-gradient-to-r from-white to-teal-50 border-b border-teal-100 p-3 px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-800">Send Email</h1>
              <p className="text-xs text-teal-700">Compose custom emails or send template emails</p>
            </div>
            <Link href="/admin/emails">
              <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Emails
              </Button>
            </Link>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg border flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                <div>
                  <p className="font-medium text-gray-900">Sending Emails...</p>
                  <p className="text-sm text-gray-600">Please wait while we process your request</p>
                </div>
              </div>
            </div>
          )}
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Compose Custom Email</span>
                <span className="sm:hidden">Compose</span>
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Send Template Email</span>
                <span className="sm:hidden">Template</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-3 text-xs text-blue-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email Design</p>
                    <p>
                      Your email content will be automatically wrapped in the CIM Amplify email template design.
                      Just write your message content below.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-teal-600" />
                    Compose Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientType">Recipient Type</Label>
                    <Select value={recipientType} onValueChange={setRecipientType}>
                      <SelectTrigger id="recipientType">
                        <SelectValue placeholder="Select recipient type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single User</SelectItem>
                        <SelectItem value="multiple">Multiple Specific Users</SelectItem>
                        <SelectItem value="all">All Users (Buyers, Sellers, Admins, Members)</SelectItem>
                        <SelectItem value="all-buyers">All Buyers</SelectItem>
                        <SelectItem value="all-sellers">All Sellers</SelectItem>
                        <SelectItem value="all-admins">All Admins</SelectItem>
                        <SelectItem value="all-members">All Team Members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recipientType === "single" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="recipientEmail">Recipient Email</Label>
                        <Input
                          id="recipientEmail"
                          type="email"
                          placeholder="user@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recipientRole">Recipient Role</Label>
                        <Select value={recipientRole} onValueChange={setRecipientRole}>
                          <SelectTrigger id="recipientRole">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">Buyer</SelectItem>
                            <SelectItem value="seller">Seller</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="buyer-member">Buyer Team Member</SelectItem>
                            <SelectItem value="seller-member">Seller Team Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          Select the role in case the same email is used for multiple accounts
                        </p>
                      </div>
                    </>
                  )}

                  {recipientType === "multiple" && (
                    <>
                      <div className="space-y-2">
                        <Label>Add Recipients</Label>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="user@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="flex-1"
                          />
                          <Select value={recipientRole} onValueChange={setRecipientRole}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buyer">Buyer</SelectItem>
                              <SelectItem value="seller">Seller</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="buyer-member">Buyer Member</SelectItem>
                              <SelectItem value="seller-member">Seller Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="button" onClick={addRecipient} size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {multipleRecipients.length > 0 && (
                        <div className="space-y-2">
                          <Label>Recipients ({multipleRecipients.length})</Label>
                          <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                            {multipleRecipients.map((recipient, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 p-2 rounded"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{recipient.email}</p>
                                  <p className="text-xs text-gray-500 capitalize">{recipient.role.replace("-", " ")}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeRecipient(index)}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Email subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Message Body</Label>
                    <Textarea
                      id="body"
                      placeholder="Write your email message here. You can use HTML tags for formatting if needed."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Tip: You can use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;br/&gt;, &lt;ul&gt;, &lt;li&gt; for formatting
                    </p>
                  </div>

                  <Button
                    onClick={handleSendEmail}
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : "Send Email"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <Card className="bg-amber-50 border-amber-100">
                <CardContent className="p-3 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Template Emails</p>
                    <p>
                      These are pre-built email templates with dynamic data. The system will automatically generate
                      the content based on current data (deals, buyers, etc.) and send to selected recipients.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    Send Template Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateType">Email Template</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {EMAIL_TEMPLATES.map((template) => {
                        const IconComponent = template.icon;
                        const isSelected = templateType === template.value;
                        return (
                          <Card
                            key={template.value}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isSelected
                                ? "ring-2 ring-teal-500 bg-teal-50 border-teal-200"
                                : "hover:border-teal-200"
                            }`}
                            onClick={() => setTemplateType(template.value)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                  template.category === "buyer" ? "bg-blue-100 text-blue-600" :
                                  template.category === "advisor" ? "bg-green-100 text-green-600" :
                                  "bg-purple-100 text-purple-600"
                                }`}>
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm text-gray-900 truncate">
                                    {template.label}
                                  </h3>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {template.description}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {template.details}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {template.frequency}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {template.recipientType}
                                    </Badge>
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {templateType && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-teal-800">
                              Selected: {EMAIL_TEMPLATES.find(t => t.value === templateType)?.label}
                            </h4>
                            <p className="text-sm text-teal-700 mt-1">
                              {EMAIL_TEMPLATES.find(t => t.value === templateType)?.description}
                            </p>
                            <p className="text-xs text-teal-600 mt-2">
                              {EMAIL_TEMPLATES.find(t => t.value === templateType)?.details}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateRecipientType">Send To</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {templateType === "advisor-monthly" && (
                        <>
                          <Card
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                              templateRecipientType === "all-sellers"
                                ? "ring-2 ring-teal-500 bg-teal-50 border-teal-200"
                                : "hover:border-teal-200"
                            }`}
                            onClick={() => setTemplateRecipientType("all-sellers")}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-green-600" />
                                <div>
                                  <h4 className="font-medium text-sm">All Advisors/Sellers</h4>
                                  <p className="text-xs text-gray-600">Send to all verified advisors</p>
                                </div>
                                {templateRecipientType === "all-sellers" && (
                                  <CheckCircle className="h-4 w-4 text-teal-600 ml-auto" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          <Card
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                              templateRecipientType === "single"
                                ? "ring-2 ring-teal-500 bg-teal-50 border-teal-200"
                                : "hover:border-teal-200"
                            }`}
                            onClick={() => setTemplateRecipientType("single")}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-sm">Single Advisor/Seller</h4>
                                  <p className="text-xs text-gray-600">Send to specific advisor</p>
                                </div>
                                {templateRecipientType === "single" && (
                                  <CheckCircle className="h-4 w-4 text-teal-600 ml-auto" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      {(templateType === "buyer-monthly" || templateType === "semiannual-buyer-reminder") && (
                        <>
                          <Card
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                              templateRecipientType === "all-buyers"
                                ? "ring-2 ring-teal-500 bg-teal-50 border-teal-200"
                                : "hover:border-teal-200"
                            }`}
                            onClick={() => setTemplateRecipientType("all-buyers")}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-sm">All Buyers</h4>
                                  <p className="text-xs text-gray-600">Send to all verified buyers</p>
                                </div>
                                {templateRecipientType === "all-buyers" && (
                                  <CheckCircle className="h-4 w-4 text-teal-600 ml-auto" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          <Card
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                              templateRecipientType === "single"
                                ? "ring-2 ring-teal-500 bg-teal-50 border-teal-200"
                                : "hover:border-teal-200"
                            }`}
                            onClick={() => setTemplateRecipientType("single")}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-sm">Single Buyer</h4>
                                  <p className="text-xs text-gray-600">Send to specific buyer</p>
                                </div>
                                {templateRecipientType === "single" && (
                                  <CheckCircle className="h-4 w-4 text-teal-600 ml-auto" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      {templateType === "introduction-followup" && (
                        <Card className="col-span-full cursor-pointer transition-all duration-200 hover:shadow-md ring-2 ring-teal-500 bg-teal-50 border-teal-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-purple-600" />
                              <div>
                                <h4 className="font-medium text-sm">All Introduction Follow-Ups</h4>
                                <p className="text-xs text-gray-600">Send follow-up emails for all eligible introductions (3 days after acceptance)</p>
                              </div>
                              <CheckCircle className="h-4 w-4 text-teal-600 ml-auto" />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    {templateType && templateType !== "introduction-followup" && (
                      <p className="text-xs text-gray-500 mt-2">
                        {templateType === "advisor-monthly"
                          ? "Advisor templates can only be sent to advisors/sellers."
                          : "Buyer templates can only be sent to buyers."
                        }
                      </p>
                    )}
                    {templateType === "introduction-followup" && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-amber-800">Introduction Follow-Up</p>
                            <p className="text-xs text-amber-700 mt-1">
                              This template sends follow-up emails to both buyers and advisors for eligible introductions.
                              It will automatically find introductions made 3 days ago that haven't been followed up yet.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {templateRecipientType === "single" && (
                    <div className="space-y-2">
                      <Label htmlFor="templateRecipientEmail">Recipient Email</Label>
                      <Input
                        id="templateRecipientEmail"
                        type="email"
                        placeholder="user@example.com"
                        value={templateRecipientEmail}
                        onChange={(e) => setTemplateRecipientEmail(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Preview functionality could be added here
                        toast({
                          title: "Preview",
                          description: "Email preview feature coming soon!",
                        });
                      }}
                      disabled={!templateType}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={handleSendTemplateEmail}
                      disabled={loading || !templateType}
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? "Sending..." : "Send Template Email"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Confirmation Dialog */}
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-teal-600" />
                  Confirm Email Send
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  {confirmData && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Template:</span>
                          <Badge variant="outline">{confirmData.template.label}</Badge>
                          <Badge variant="secondary">{confirmData.template.frequency}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Recipients:</span>
                          <Badge variant="secondary">
                            {confirmData.recipientType === "all-buyers" ? "All Buyers" :
                             confirmData.recipientType === "all-sellers" ? "All Advisors/Sellers" :
                             confirmData.recipientType === "all" ? "All Eligible Introductions" :
                             `Single: ${confirmData.recipientEmail}`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Estimated Recipients:</span>
                          <span className="text-lg font-bold text-teal-600">
                            ~{confirmData.estimatedRecipients}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                          {confirmData.template.details}
                        </div>
                      </div>

                      <Separator />

                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-900 mb-2">Are you sure you want to send this email?</p>
                        <p>This action cannot be undone. The emails will be sent immediately to all selected recipients.</p>
                      </div>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmSendTemplateEmail}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
