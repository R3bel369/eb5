import { useState, useEffect, useRef } from 'react'
import {
  BookOpen, Plus, Search, Edit3, Trash2, CheckCircle2,
  XCircle, RotateCcw, Sparkles, Send, Tag, HelpCircle,
  Check, X, FileText, Upload, FileUp, Download, FileSpreadsheet,
  AlertCircle, Loader2, File
} from 'lucide-react'
import {
  getKnowledgeBaseItems, addKnowledgeBaseItem, updateKnowledgeBaseItem,
  deleteKnowledgeBaseItem, resetKnowledgeBaseToDefaults, findKnowledgeBaseReply,
  importKnowledgeBaseItems, parseKnowledgeBaseCsv, parseKnowledgeBaseJson, parseKnowledgeBaseText,
  type KnowledgeBaseItem
} from '../../lib/knowledgeBase'
import { extractTextFromPdf, parsePdfTextToKnowledgeItems } from '../../lib/pdfParser'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'All',
  'Investment Capital',
  'Job Creation',
  'Regional Centers',
  'Process & Timeline',
  'Source of Funds',
  'General EB-5',
  'Custom Replies',
] as const

type CategoryType = typeof CATEGORIES[number]

export function AdminKnowledgeBasePanel() {
  const [items, setItems]               = useState<KnowledgeBaseItem[]>([])
  const [selectedCategory, setCategory] = useState<CategoryType>('All')
  const [search, setSearch]             = useState('')
  const [modalOpen, setModalOpen]       = useState(false)
  const [editingItem, setEditingItem]   = useState<KnowledgeBaseItem | null>(null)

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [parsedPreview, setParsedPreview]     = useState<Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>>>([])
  const [uploadError, setUploadError]         = useState('')
  const [isParsingPdf, setIsParsingPdf]       = useState(false)
  const fileInputRef                          = useRef<HTMLInputElement>(null)

  // Test simulator state
  const [testQuery, setTestQuery]       = useState('')
  const [testResult, setTestResult]     = useState<{ reply: string; matchedItem: KnowledgeBaseItem } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Custom Replies' as KnowledgeBaseItem['category'],
    tags: '',
    isActive: true,
  })

  const loadItems = () => {
    setItems(getKnowledgeBaseItems())
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      question: '',
      answer: '',
      category: 'Custom Replies',
      tags: '',
      isActive: true,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (item: KnowledgeBaseItem) => {
    setEditingItem(item)
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      tags: item.tags.join(', '),
      isActive: item.isActive,
    })
    setModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Please provide both a question and a customer reply.')
      return
    }

    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    if (editingItem) {
      updateKnowledgeBaseItem(editingItem.id, {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category,
        tags: tagsArray,
        isActive: formData.isActive,
      })
      toast.success('Knowledge Base article updated!')
    } else {
      addKnowledgeBaseItem({
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category,
        tags: tagsArray,
        isActive: formData.isActive,
      })
      toast.success('New customer reply added to Knowledge Base!')
    }

    setModalOpen(false)
    loadItems()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this knowledge base article?')) {
      deleteKnowledgeBaseItem(id)
      toast.success('Knowledge base article removed.')
      loadItems()
    }
  }

  const handleToggleActive = (item: KnowledgeBaseItem) => {
    updateKnowledgeBaseItem(item.id, { isActive: !item.isActive })
    toast.success(item.isActive ? 'Reply deactivated' : 'Reply activated for chatbot')
    loadItems()
  }

  const handleResetDefaults = () => {
    if (confirm('Reset knowledge base to USCIS default guidelines? Any custom entries will be restored to defaults.')) {
      resetKnowledgeBaseToDefaults()
      toast.success('Restored default EB-5 knowledge base!')
      loadItems()
    }
  }

  const handleTestSimulator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testQuery.trim()) return
    const match = findKnowledgeBaseReply(testQuery.trim())
    setTestResult(match)
  }

  // ── File Upload Handlers ───────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    setUploadError('')
    setParsedPreview([])

    const ext = file.name.split('.').pop()?.toLowerCase()

    // ── Handle PDF files ──
    if (ext === 'pdf') {
      setIsParsingPdf(true)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const text = await extractTextFromPdf(arrayBuffer)
        if (!text || text.trim().length === 0) {
          setUploadError('Could not extract text from this PDF file. The PDF may be scanned images or password-protected.')
          setIsParsingPdf(false)
          return
        }

        const parsed = parsePdfTextToKnowledgeItems(text, file.name)
        if (parsed.length === 0) {
          setUploadError('Extracted text from the PDF, but could not detect structured questions/sections. Try a document with headings, Q&A blocks, or numbered topics.')
        } else {
          setParsedPreview(parsed)
          toast.success(`Extracted ${parsed.length} knowledge articles from PDF!`)
        }
      } catch (err: any) {
        console.error('PDF parsing error:', err)
        setUploadError(`Failed to process PDF: ${err?.message || 'Unknown error'}`)
      } finally {
        setIsParsingPdf(false)
      }
      return
    }

    // ── Handle JSON, CSV, TXT, MD ──
    const reader = new FileReader()
    reader.onload = event => {
      const content = event.target?.result as string
      if (!content) {
        setUploadError('Uploaded file appears to be empty.')
        return
      }

      let parsed: Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>> = []

      if (ext === 'json') {
        parsed = parseKnowledgeBaseJson(content)
      } else if (ext === 'csv') {
        parsed = parseKnowledgeBaseCsv(content)
      } else {
        parsed = parseKnowledgeBaseText(content)
      }

      if (parsed.length === 0) {
        setUploadError(
          'Could not find valid Q&A entries in this file. Please ensure it follows the CSV (Category, Question, Answer, Tags), JSON, or heading structure.'
        )
      } else {
        setParsedPreview(parsed)
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return
    const count = importKnowledgeBaseItems(parsedPreview)
    toast.success(`Successfully imported ${count} new knowledge articles into Knowledge Base!`)
    setUploadModalOpen(false)
    setParsedPreview([])
    setUploadedFileName('')
    loadItems()
  }

  const downloadSampleJson = () => {
    const sample = [
      {
        category: 'Investment Capital',
        question: 'What is the RIA 2022 TEA investment threshold for rural projects?',
        answer: 'Under the EB-5 Reform and Integrity Act of 2022 (RIA), the minimum qualifying investment in a Targeted Employment Area (TEA) is $800,000.',
        tags: ['$800k', 'rural', 'TEA', 'RIA 2022'],
        isActive: true,
      },
      {
        category: 'Process & Timeline',
        question: 'Can H-1B holders file concurrently under EB-5?',
        answer: 'Yes! Concurrent filing of Form I-526E and Form I-485 is permitted for lawful nonimmigrants in the U.S., allowing immediate application for work (EAD) and travel authorization.',
        tags: ['concurrent filing', 'H-1B', 'I-485', 'EAD'],
        isActive: true,
      },
    ]
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knowledge_base_template.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadSampleCsv = () => {
    const sample = `Category,Question,Answer,Tags
"Investment Capital","What is the minimum EB-5 capital required in 2024?","The minimum qualifying capital under the EB-5 RIA is $800,000 for Targeted Employment Areas (TEA) and $1,050,000 for standard non-TEA projects.","minimum capital,$800k,$1050k,TEA"
"Job Creation","What qualifies as a full-time job under USCIS rules?","A qualifying full-time job is at least 35 hours per week filled by a U.S. citizen, lawful permanent resident, or authorized immigrant.","35 hours,full-time,US worker"
`
    const blob = new Blob([sample], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knowledge_base_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadSamplePdf = () => {
    // Generate valid downloadable EB-5 Policy FAQ PDF
    const textContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 415 >>
stream
BT
/F1 14 Tf
50 730 Td
(Shoora EB-5 Advisory - Official RIA Knowledge Base) Tj
/F1 11 Tf
0 -30 Td
(Question: What is the RIA 2022 TEA investment threshold for rural projects?) Tj
0 -20 Td
(Answer: Under RIA 2022, minimum qualifying investment in a Targeted Employment Area is $800,000.) Tj
0 -30 Td
(Question: Can H-1B holders file concurrently under EB-5?) Tj
0 -20 Td
(Answer: Yes, concurrent filing of Form I-526E and Form I-485 is permitted for lawful nonimmigrants.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
0000000694 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
765
%%EOF`
    const blob = new Blob([textContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knowledge_base_sample.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filtered items
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const q = search.toLowerCase().trim()
    const matchesSearch = !q ||
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q))
    return matchesCategory && matchesSearch
  })

  const activeCount = items.filter(i => i.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-navy-900">Knowledge Base & Customer Replies</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-100 text-gold-800">
              {activeCount} Active
            </span>
          </div>
          <p className="text-xs text-navy-500 mt-1">
            Manage EB-5 intelligence, answers, and customized replies delivered to prospective investors by the AI chatbot.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetDefaults}
            className="btn-ghost text-xs py-2 px-3 border border-gray-200"
            title="Restore baseline USCIS rules"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          {/* Upload File Button */}
          <button
            onClick={() => {
              setUploadModalOpen(true)
              setParsedPreview([])
              setUploadedFileName('')
              setUploadError('')
            }}
            className="btn-secondary text-xs py-2 px-3.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-navy-700" />
            Upload File
          </button>

          {/* Add Customer Reply Button */}
          <button
            onClick={handleOpenAdd}
            className="btn-primary text-xs py-2 px-3.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Customer Reply
          </button>
        </div>
      </div>

      {/* Main Grid: Content (2 cols) & Simulator (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: KB Articles List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-white text-navy-600 border border-gray-200 hover:bg-navy-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="search"
              placeholder="Search knowledge by question, keyword, or reply text…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-xs py-2.5 bg-white"
            />
          </div>

          {/* Articles list */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="card py-12 text-center text-navy-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-navy-300" />
                <p className="text-sm font-medium">No knowledge base articles found</p>
                <p className="text-xs text-navy-400 mt-1">Upload a file or add a new customer reply to populate this section.</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`card transition-all border ${
                    item.isActive ? 'border-gray-200 hover:border-gold-300' : 'border-gray-200 bg-gray-50/70 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-navy-50 text-navy-700 border border-navy-100">
                        {item.category}
                      </span>
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active in Chatbot</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-400" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-navy-600 hover:bg-navy-50 hover:text-navy-900 transition-colors"
                        title="Edit article"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Delete article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question / Inquiry */}
                  <h3 className="font-display font-semibold text-navy-900 text-sm mb-2">
                    {item.question}
                  </h3>

                  {/* Customer Reply Content */}
                  <div className="p-3 rounded-xl bg-ivory-50 border border-amber-100 text-xs text-navy-800 leading-relaxed whitespace-pre-line mb-3">
                    {item.answer}
                  </div>

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-3 h-3 text-navy-400" />
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-white border border-gray-200 text-navy-600 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Customer Reply Simulator */}
        <div className="space-y-4">
          <div className="card border-2 border-gold-200 bg-gradient-to-b from-white to-gold-50/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              <h2 className="font-display font-bold text-navy-900 text-sm">Customer Reply Simulator</h2>
            </div>
            <p className="text-xs text-navy-500 mb-3">
              Type any customer inquiry below to test how the AI chatbot evaluates and answers using this knowledge base.
            </p>

            <form onSubmit={handleTestSimulator} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., What is the TEA amount? Can I work on H-1B?"
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  className="input-field text-xs py-2 pr-8"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gold-600 hover:text-gold-700"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'TEA minimum investment',
                  'Concurrent filing I-485',
                  'Job creation standards',
                  'Source of funds proof',
                ].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setTestQuery(q)
                      setTestResult(findKnowledgeBaseReply(q))
                    }}
                    className="text-[10px] bg-white hover:bg-gold-100 border border-gold-200 text-navy-700 px-2 py-0.5 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </form>

            {/* Test result output */}
            {testResult ? (
              <div className="mt-4 p-3 rounded-xl bg-white border border-emerald-200 shadow-sm animate-fade-in text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Matched Knowledge Base
                  </span>
                  <span className="text-[10px] text-navy-400">
                    Category: {testResult.matchedItem.category}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-navy-600">
                  Trigger: "{testResult.matchedItem.question}"
                </div>
                <div className="text-navy-900 bg-gray-50 p-2.5 rounded-lg border border-gray-100 whitespace-pre-line leading-relaxed">
                  {testResult.reply}
                </div>
              </div>
            ) : testQuery && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                No direct rule matched. The chatbot will deliver general RIA 2022 guidance and encourage a consultation request.
              </div>
            )}
          </div>

          {/* Quick upload & format guidelines */}
          <div className="card text-xs text-navy-600 space-y-2">
            <h3 className="font-semibold text-navy-900 flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-gold-600" />
              File Upload Supported Formats
            </h3>
            <p className="text-[11px] leading-relaxed">
              • <strong>PDF Documents (.pdf)</strong>: Official EB-5 brochures, USCIS guides, or FAQs. Text is automatically parsed and organized into structured Q&A articles.
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong>JSON (.json)</strong>: Array of objects with <code>category</code>, <code>question</code>, <code>answer</code>, and <code>tags</code>.
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong>CSV (.csv)</strong>: Spreadsheet with columns <code>Category, Question, Answer, Tags</code>.
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong>Markdown (.md / .txt)</strong>: Document with headings <code>## Question Title</code> followed by the reply body.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal: Upload Knowledge File ────────────────────────────────────── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-card-hover animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-gold-600" />
                <h2 className="font-display font-bold text-navy-900 text-base">
                  Upload Knowledge Base File
                </h2>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-navy-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Drop / Select Area */}
              <div
                onClick={() => !isParsingPdf && fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                  isParsingPdf
                    ? "border-gold-400 bg-gold-50/30 cursor-wait"
                    : "border-gray-300 hover:border-gold-500 cursor-pointer bg-gray-50/50 hover:bg-gold-50/20"
                )}
              >
                {isParsingPdf ? (
                  <div className="py-2">
                    <Loader2 className="w-8 h-8 text-gold-600 mx-auto mb-2 animate-spin" />
                    <p className="font-semibold text-navy-900 mb-1">
                      Analyzing & Extracting PDF Knowledge...
                    </p>
                    <p className="text-[11px] text-navy-500">
                      Reading document stream and identifying Q&A articles
                    </p>
                  </div>
                ) : (
                  <>
                    <FileUp className="w-8 h-8 text-gold-600 mx-auto mb-2" />
                    <p className="font-semibold text-navy-900 mb-1">
                      Click to select or drag & drop file
                    </p>
                    <p className="text-[11px] text-navy-400">
                      Accepts .pdf, .json, .csv, .txt, or .md knowledge files
                    </p>
                  </>
                )}
                {uploadedFileName && !isParsingPdf && (
                  <div className="mt-3 inline-block px-3 py-1 bg-navy-50 text-navy-800 rounded-lg font-medium text-xs border border-navy-100">
                    Selected: {uploadedFileName}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.json,.csv,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Download templates */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] font-medium text-navy-600">Sample files & templates:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={downloadSamplePdf}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:text-red-800 bg-white px-2 py-1 rounded border border-gray-200 hover:bg-red-50 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    PDF Sample
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white px-2 py-1 rounded border border-gray-200 hover:bg-emerald-50 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    CSV Template
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleJson}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white px-2 py-1 rounded border border-gray-200 hover:bg-blue-50 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    JSON Template
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{uploadError}</p>
                </div>
              )}

              {/* Preview of Parsed Items */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Found {parsedPreview.length} Knowledge Article{parsedPreview.length === 1 ? '' : 's'}
                    </span>
                    <span className="text-[10px] text-navy-400">Ready to import</span>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200">
                    {parsedPreview.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg text-[11px] border border-gray-100 shadow-2xs">
                        <span className="font-semibold text-navy-900 block truncate">{item.question}</span>
                        <span className="text-navy-500 block truncate">{item.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="btn-ghost text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                >
                  Confirm & Import ({parsedPreview.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Single Article ─────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-card-hover animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="font-display font-bold text-navy-900 text-base">
                {editingItem ? 'Edit Knowledge Base Reply' : 'Add New Customer Reply'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-navy-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-navy-800 block mb-1">
                  Customer Inquiry / Question Pattern *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., What are the TEA investment requirements?"
                  value={formData.question}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-navy-800 block mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="input-field text-xs py-2"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-navy-800 block mb-1">
                    Matching Tags / Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., tea, $800k, rural, jobs"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-navy-800 block mb-1">
                  Customer Reply Text *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Enter the authoritative, professional response that the AI chatbot should reply with when this topic is discussed…"
                  value={formData.answer}
                  onChange={e => setFormData({ ...formData, answer: e.target.value })}
                  className="input-field text-xs py-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="active-toggle"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-navy-900 focus:ring-navy-500"
                />
                <label htmlFor="active-toggle" className="font-medium text-navy-700 cursor-pointer">
                  Activate this reply for customer conversations immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-4"
                >
                  {editingItem ? 'Save Updates' : 'Add Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
