import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Download, Search, X } from "lucide-react";
import {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  type FAQ,
  type CreateFAQData,
  type UpdateFAQData,
} from "../../../services/api/admin/adminContentService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminFAQ() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchFAQs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getFAQs({
          search: searchTerm,
          page: currentPage,
          limit: parseInt(rowsPerPage),
        });

        if (response.success) {
          setFaqs(response.data);
        } else {
          setError("Failed to load FAQs");
        }
      } catch (err: any) {
        console.error("Error fetching FAQs:", err);
        setError(
          err.response?.data?.message ||
          "Failed to load FAQs. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [
    isAuthenticated,
    token,
    searchTerm,
    currentPage,
    rowsPerPage,
  ]);

  const handleAddFAQ = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      showToast("Please fill in both question and answer", "error");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingFAQ !== null) {
        const updateData: UpdateFAQData = {
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
        };

        const response = await updateFAQ(editingFAQ._id, updateData);

        if (response.success) {
          setFaqs((prev) =>
            prev.map((faq) =>
              faq._id === editingFAQ._id
                ? {
                  ...faq,
                  question: faqQuestion.trim(),
                  answer: faqAnswer.trim(),
                }
                : faq
            )
          );
          showToast("FAQ updated successfully!", "success");
          setEditingFAQ(null);
        } else {
          showToast("Failed to update FAQ", "error");
        }
      } else {
        const faqData: CreateFAQData = {
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
          isActive: true,
        };

        const response = await createFAQ(faqData);

        if (response.success) {
          setFaqs((prev) => [...prev, response.data]);
          showToast("FAQ added successfully!", "success");
        } else {
          showToast("Failed to add FAQ", "error");
        }
      }

      setFaqQuestion("");
      setFaqAnswer("");
    } catch (err: any) {
      console.error("Error saving FAQ:", err);
      showToast(
        err.response?.data?.message || "Failed to save FAQ. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setEditingFAQ(faq);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await deleteFAQ(id);

      if (response.success) {
        setFaqs((prev) => prev.filter((faq) => faq._id !== id));
        showToast("FAQ deleted successfully!", "success");

        if (editingFAQ?._id === id) {
          setEditingFAQ(null);
          setFaqQuestion("");
          setFaqAnswer("");
        }
      } else {
        showToast("Failed to delete FAQ", "error");
      }
    } catch (err: any) {
      console.error("Error deleting FAQ:", err);
      showToast(
        err.response?.data?.message || "Failed to delete FAQ. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = ["ID", "FAQ Question", "FAQ Answer"];
    const csvContent = [
      headers.join(","),
      ...faqs.map((faq) =>
        [faq._id, `"${faq.question}"`, `"${faq.answer}"`].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `faqs_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: "Question",
      accessorKey: "question",
      cell: (f: FAQ) => <span className="font-medium">{f.question}</span>
    },
    {
      header: "Answer",
      accessorKey: "answer",
      cell: (f: FAQ) => <span className="text-muted-foreground">{f.answer}</span>
    },
    {
      header: "Action",
      accessorKey: "_id",
      cell: (f: FAQ) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(f)}
            disabled={submitting}
            className="h-8 w-8 text-primary hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(f._id)}
            disabled={submitting}
            className="h-8 w-8 text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQ Management"
        description="Create and manage frequently asked questions."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit FAQ Panel */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {editingFAQ ? "Edit FAQ" : "Add FAQ"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faqQuestion">FAQ Question</Label>
              <Input
                type="text"
                id="faqQuestion"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="Enter FAQ Question"
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faqAnswer">FAQ Answer</Label>
              <Textarea
                id="faqAnswer"
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Enter FAQ Answer"
                rows={6}
                className="bg-muted/50 border-border resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleAddFAQ}
                disabled={submitting}
                className="w-full font-bold uppercase tracking-wide"
              >
                {submitting ? "Processing..." : editingFAQ ? "Update FAQ" : "Add FAQ"}
              </Button>

              {editingFAQ && (
                <Button
                  onClick={() => {
                    setEditingFAQ(null);
                    setFaqQuestion("");
                    setFaqAnswer("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View FAQ Table */}
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">All FAQs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  className="pl-9 bg-muted/50 border-border"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-24 bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={faqs}
              loading={loading}
              emptyMessage="No FAQs found."
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing <span className="font-bold text-foreground">{faqs.length}</span> FAQs
              </p>
              <p>Page {currentPage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
