// ─── Knowledge Base Store & Customer Reply Engine ─────────────────────────────
// Stores EB-5 domain knowledge, FAQ templates, and custom customer replies configured by Admin.
// Synchronizes with localStorage and optional Supabase knowledge_base table.

export interface KnowledgeBaseItem {
  id: string
  question: string
  answer: string
  category: 'Investment Capital' | 'Job Creation' | 'Regional Centers' | 'Process & Timeline' | 'Source of Funds' | 'General EB-5' | 'Custom Replies'
  tags: string[]
  isActive: boolean
  updatedAt: string
}

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeBaseItem[] = [
  {
    id: 'kb-1',
    category: 'Investment Capital',
    question: 'What is the minimum investment amount for the EB-5 visa under RIA 2022?',
    answer: 'Under the EB-5 Reform and Integrity Act of 2022 (RIA), the minimum qualifying investment is $800,000 for projects located in a Targeted Employment Area (TEA) — either a Rural Area or a High Unemployment Area — or designated infrastructure projects. For non-TEA projects, the minimum investment is $1,050,000. All funds must be at risk and sourced from lawful, verifiable capital.',
    tags: ['minimum investment', '$800,000', '$800k', '$1,050,000', 'TEA', 'capital', 'RIA 2022'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-2',
    category: 'Job Creation',
    question: 'How many jobs must an EB-5 investment create?',
    answer: 'Each EB-5 investment must create or preserve at least 10 full-time jobs (minimum 35 hours per week) for qualifying U.S. workers for a minimum of two years. If you invest through a USCIS-approved Regional Center, these 10 jobs can include indirect and induced jobs modeled through approved economic methodologies (e.g., RIMS II, IMPLAN). In direct EB-5 investments, only direct W-2 employees count.',
    tags: ['jobs', '10 jobs', 'job creation', 'indirect jobs', 'regional center', 'direct investment', 'W-2'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-3',
    category: 'Regional Centers',
    question: 'What is the difference between Regional Center and Direct EB-5 investments?',
    answer: 'In a Regional Center project, the investor pools capital into a USCIS-designated entity that manages the job-creating enterprise. A key advantage is that job creation can be calculated using indirect and induced economic models, significantly reducing immigration risk for the investor. In a Direct investment, the investor typically manages or directly operates the business, and only direct, full-time W-2 employees count toward the 10-job requirement.',
    tags: ['regional center', 'direct eb-5', 'indirect jobs', 'comparison', 'passive investment'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-4',
    category: 'Process & Timeline',
    question: 'Can I file I-526E and apply for a work/travel permit concurrently?',
    answer: 'Yes! Under RIA 2022, if you are already legally present in the United States on another nonimmigrant visa (such as H-1B, L-1, F-1, or O-1), you can file Form I-526E (immigrant petition) concurrently with Form I-485 (Adjustment of Status). This allows you to simultaneously obtain an Employment Authorization Document (EAD / Form I-765) and Advance Parole travel document (Form I-131) typically within 60 to 180 days while your EB-5 petition is pending.',
    tags: ['concurrent filing', 'I-485', 'I-765', 'EAD', 'work permit', 'advance parole', 'H-1B', 'F-1'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-5',
    category: 'Process & Timeline',
    question: 'What are the set-aside visa categories and why are they important for Indian and Chinese investors?',
    answer: 'RIA 2022 reserved 32% of annual EB-5 visas for priority set-aside categories: 20% for Rural areas, 10% for High Unemployment Areas (HUA), and 2% for Infrastructure projects. Crucially, these set-aside categories are currently designated as "Current" on the USCIS Visa Bulletin for all nationalities, allowing applicants from backlogged countries like India and China to bypass years of visa wait times.',
    tags: ['set-aside', 'rural', 'high unemployment', 'infrastructure', 'retrogression', 'india', 'china', 'visa bulletin'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-6',
    category: 'Source of Funds',
    question: 'What documents are required to prove lawful Source of Funds (SOF)?',
    answer: 'USCIS requires complete documentation demonstrating that your investment capital was lawfully obtained. Acceptable sources include: employment income/bonuses, business distributions/dividends, property sales, gifts (with documentation proving how the donor earned the capital), inheritances, or commercial loans backed by your personal assets. A licensed immigration attorney will prepare an exhaustive audit trail tracing the funds from origin to the escrow account.',
    tags: ['source of funds', 'SOF', 'lawful capital', 'gift', 'property sale', 'inheritance', 'escrow'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-7',
    category: 'Process & Timeline',
    question: 'What is the full roadmap from EB-5 application to U.S. Citizenship?',
    answer: 'The EB-5 journey has 4 key milestones:\n1. Form I-526E filing and approval with USCIS.\n2. Obtaining Conditional Permanent Residency (2-year green card via Consular Processing or I-485 Adjustment of Status).\n3. Filing Form I-829 during the 90 days prior to the 2-year anniversary to remove conditions by proving the capital was sustained and 10 jobs were created.\n4. Applying for U.S. Citizenship (Form N-400) after 5 years of permanent residency.',
    tags: ['roadmap', 'timeline', 'I-526E', 'I-829', 'conditional green card', 'citizenship', 'N-400'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-8',
    category: 'General EB-5',
    question: 'Can my spouse and children be included in my EB-5 application?',
    answer: 'Yes. Your qualifying EB-5 petition covers the principal investor, your legal spouse, and all unmarried children under 21 years of age at the time of filing. Under the Child Status Protection Act (CSPA), a child\'s age is generally frozen while the I-526E petition is pending, helping prevent them from "aging out".',
    tags: ['family', 'spouse', 'children', 'under 21', 'CSPA', 'aging out'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-9',
    category: 'Custom Replies',
    question: 'How do I schedule a consultation with a Shoora EB-5 advisor?',
    answer: 'You can easily request a consultation directly through this chat by clicking the "Request Consultation" button or entering your preferred contact details. One of our dedicated EB-5 advisors will review your investment timeframe, background, and objectives to provide a personalized, confidential consultation.',
    tags: ['consultation', 'advisor', 'contact', 'appointment', 'schedule', 'speak to human'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
]

const STORAGE_KEY = 'shoora_kb_items'

export function getKnowledgeBaseItems(): KnowledgeBaseItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KNOWLEDGE_BASE))
      return DEFAULT_KNOWLEDGE_BASE
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch (err) {
    console.warn('Failed to read knowledge base from storage:', err)
  }
  return DEFAULT_KNOWLEDGE_BASE
}

export function saveKnowledgeBaseItems(items: KnowledgeBaseItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Failed to save knowledge base:', err)
  }
}

export function addKnowledgeBaseItem(item: Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>): KnowledgeBaseItem {
  const current = getKnowledgeBaseItems()
  const newItem: KnowledgeBaseItem = {
    ...item,
    id: `kb-custom-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  }
  const updated = [newItem, ...current]
  saveKnowledgeBaseItems(updated)
  return newItem
}

export function updateKnowledgeBaseItem(id: string, updates: Partial<KnowledgeBaseItem>): KnowledgeBaseItem | null {
  const current = getKnowledgeBaseItems()
  const idx = current.findIndex(i => i.id === id)
  if (idx === -1) return null
  const updatedItem: KnowledgeBaseItem = {
    ...current[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  current[idx] = updatedItem
  saveKnowledgeBaseItems(current)
  return updatedItem
}

export function deleteKnowledgeBaseItem(id: string): boolean {
  const current = getKnowledgeBaseItems()
  const filtered = current.filter(i => i.id !== id)
  if (filtered.length === current.length) return false
  saveKnowledgeBaseItems(filtered)
  return true
}

export function resetKnowledgeBaseToDefaults(): KnowledgeBaseItem[] {
  saveKnowledgeBaseItems(DEFAULT_KNOWLEDGE_BASE)
  return DEFAULT_KNOWLEDGE_BASE
}

// ─── Import & File Parsers ───────────────────────────────────────────────────

export function importKnowledgeBaseItems(newItems: Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>>): number {
  if (!newItems || newItems.length === 0) return 0
  const current = getKnowledgeBaseItems()

  let count = 0
  const additions: KnowledgeBaseItem[] = []

  for (const item of newItems) {
    if (!item.question?.trim() || !item.answer?.trim()) continue

    // Avoid duplicate question text
    const exists = current.some(c => c.question.toLowerCase().trim() === item.question.toLowerCase().trim())
    if (!exists) {
      additions.push({
        id: `kb-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        question: item.question.trim(),
        answer: item.answer.trim(),
        category: item.category || 'General EB-5',
        tags: Array.isArray(item.tags) ? item.tags : [],
        isActive: item.isActive !== false,
        updatedAt: new Date().toISOString(),
      })
      count++
    }
  }

  if (additions.length > 0) {
    saveKnowledgeBaseItems([...additions, ...current])
  }
  return count
}

export function parseKnowledgeBaseJson(jsonText: string): Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>> {
  try {
    const parsed = JSON.parse(jsonText)
    const array = Array.isArray(parsed) ? parsed : [parsed]
    return array.map(entry => ({
      question: entry.question || entry.q || entry.title || '',
      answer: entry.answer || entry.a || entry.content || entry.reply || '',
      category: entry.category || 'General EB-5',
      tags: Array.isArray(entry.tags)
        ? entry.tags
        : typeof entry.tags === 'string'
        ? entry.tags.split(',').map((t: string) => t.trim())
        : [],
      isActive: entry.isActive !== false,
    }))
  } catch (err) {
    console.error('Failed to parse knowledge base JSON:', err)
    return []
  }
}

export function parseKnowledgeBaseCsv(csvText: string): Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) return []

  // Check header
  const results: Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>> = []

  // Simple CSV parser supporting quotes
  function parseCsvLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    fields.push(current.trim())
    return fields
  }

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length >= 2) {
      // Possible layouts: Category, Question, Answer, Tags OR Question, Answer, Category, Tags
      let category = 'General EB-5'
      let question = ''
      let answer = ''
      let tags: string[] = []

      if (cols.length >= 3) {
        category = cols[0] || 'General EB-5'
        question = cols[1] || ''
        answer = cols[2] || ''
        tags = cols[3] ? cols[3].split(',').map(t => t.trim()) : []
      } else {
        question = cols[0] || ''
        answer = cols[1] || ''
      }

      if (question && answer) {
        results.push({
          question,
          answer,
          category: category as any,
          tags,
          isActive: true,
        })
      }
    }
  }

  return results
}

export function parseKnowledgeBaseText(text: string): Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>> {
  // Support Q: ... A: ... or markdown ## Heading ... Content
  const results: Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>> = []

  // Try Q&A block split
  const qaBlocks = text.split(/(?:^|\n)(?=Q(?:uestion)?:|##\s+)/i).filter(b => b.trim())

  for (const block of qaBlocks) {
    // Markdown style: ## Question \n Answer
    const mdMatch = block.match(/^##\s+(.+)\n([\s\S]+)/)
    if (mdMatch) {
      results.push({
        question: mdMatch[1].trim(),
        answer: mdMatch[2].trim(),
        category: 'Custom Replies',
        tags: [],
        isActive: true,
      })
      continue
    }

    // Q: ... A: ... style
    const qMatch = block.match(/Q(?:uestion)?:\s*([^\n]+)/i)
    const aMatch = block.match(/A(?:nswer)?:\s*([\s\S]+)/i)
    if (qMatch && aMatch) {
      results.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim(),
        category: 'Custom Replies',
        tags: [],
        isActive: true,
      })
    }
  }

  return results
}

// ─── Customer Reply Matcher ──────────────────────────────────────────────────
// Evaluates customer input against active Knowledge Base items and returns the best matching reply.
export function findKnowledgeBaseReply(userQuery: string): { reply: string; matchedItem: KnowledgeBaseItem } | null {
  const q = userQuery.toLowerCase().trim()
  if (!q) return null

  const items = getKnowledgeBaseItems().filter(i => i.isActive)

  let bestMatch: KnowledgeBaseItem | null = null
  let highestScore = 0

  for (const item of items) {
    let score = 0

    // Exact question match
    if (item.question.toLowerCase().includes(q) || q.includes(item.question.toLowerCase())) {
      score += 50
    }

    // Check tags
    for (const tag of item.tags) {
      const lowerTag = tag.toLowerCase()
      if (q.includes(lowerTag)) {
        score += 20 + lowerTag.length
      }
    }

    // Keyword word boundary matches
    const words = q.split(/\s+/).filter(w => w.length > 2)
    for (const word of words) {
      if (item.question.toLowerCase().includes(word)) {
        score += 5
      }
      if (item.answer.toLowerCase().includes(word)) {
        score += 2
      }
    }

    if (score > highestScore && score >= 15) {
      highestScore = score
      bestMatch = item
    }
  }

  if (bestMatch) {
    return {
      reply: bestMatch.answer,
      matchedItem: bestMatch,
    }
  }

  return null
}
