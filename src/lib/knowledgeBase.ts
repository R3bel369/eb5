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
  // ─── 1. Investment Capital & Financial Requirements ─────────────────────────
  {
    id: 'kb-1',
    category: 'Investment Capital',
    question: 'What is the minimum investment amount for the EB-5 visa under RIA 2022?',
    answer: 'Under the EB-5 Reform and Integrity Act of 2022 (RIA), the minimum qualifying investment is **$800,000** for projects located in a Targeted Employment Area (TEA) — either a Rural Area or a High Unemployment Area (HUA) — or designated Infrastructure projects.\n\nFor non-TEA projects, the standard minimum is **$1,050,000**. All funds must be placed "at risk" for the purpose of generating a return and creating U.S. jobs, and must be lawfully sourced.',
    tags: ['minimum investment', '$800,000', '$800k', '$1,050,000', 'TEA', 'capital', 'RIA 2022', 'cost', 'how much', 'price'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-2',
    category: 'Investment Capital',
    question: 'What additional administrative, legal, and government fees are involved in EB-5?',
    answer: 'Beyond the $800,000 capital investment, typical ancillary expenses include:\n• **Regional Center Administrative Fee**: Usually $50,000 – $80,000 (covers syndication, compliance, and project management).\n• **Immigration Attorney Legal Fees**: Typically $15,000 – $30,000 depending on source-of-funds complexity.\n• **USCIS Government Filing Fees**:\n  - Form I-526E Petition: $11,160 + $1,000 RIA Integrity Fee\n  - Form I-485 (Adjustment of Status if in U.S.): $1,440 per adult\n  - Form I-829 (Removal of Conditions): $9,525\n• **Translation / Audit / Bank Wire Expenses**: Approx. $1,000 – $3,000.',
    tags: ['fees', 'costs', 'administrative fee', 'legal fee', 'attorney fee', 'uscis fee', 'i-526e fee', 'total cost', 'expenses'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-3',
    category: 'Investment Capital',
    question: 'What is the capital sustainment period and when do I get my $800,000 back?',
    answer: 'Under USCIS policy updated following RIA 2022, investment capital must be sustained for a **minimum of two (2) full years** from the date it is deployed into the Job Creating Entity (JCE).\n\nMost high-quality Regional Center projects structure the investment as a **3 to 5-year loan** to a developer, often with extension options. Once the loan matures and job creation targets are met, the project returns the principal capital to investors according to the loan agreement and offering documents.',
    tags: ['return of capital', 'repayment', 'sustainment period', 'exit strategy', 'refund', 'pay back', '2 years', 'loan maturity'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-4',
    category: 'Investment Capital',
    question: 'What does "at-risk" capital mean under USCIS rules?',
    answer: 'USCIS mandates that all EB-5 capital must be placed **"at risk"** for commercial enterprise activity, meaning there must be a genuine risk of financial loss and a chance of gain. Under federal law, a project cannot offer a legally binding repayment guarantee or guaranteed annual return.\n\nHowever, "at-risk" does not mean reckless. Through rigorous due diligence, Shoora EB-5 prioritizes projects with low loan-to-cost ratios, senior mortgage backing, well-capitalized developers, and substantial equity buffers to protect investor principal.',
    tags: ['at risk', 'guarantee', 'risk', 'capital preservation', 'protection', 'financial risk'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-5',
    category: 'Investment Capital',
    question: 'Can I invest the $800,000 in partial installments or installments over time?',
    answer: 'Yes, USCIS permits "actively in the process of investing". An investor can file Form I-526E with a partial capital contribution (e.g., $300,000 to $500,000) provided there is an irrevocable, legally binding promissory agreement to fund the remainder within a specified timeframe (typically 90 to 180 days).\n\nHowever, acceptance depends on the individual Regional Center project policy. Shoora EB-5 can identify top-tier projects that accommodate structured partial funding schedules.',
    tags: ['installments', 'partial funding', 'split investment', 'partial payment', 'promissory note'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 2. Targeted Employment Areas (TEA) & Priority Set-Asides ───────────────
  {
    id: 'kb-6',
    category: 'General EB-5',
    question: 'What is a Targeted Employment Area (TEA) and how does it qualify for $800,000?',
    answer: 'A Targeted Employment Area (TEA) qualifies for the lower **$800,000** investment threshold (versus $1,050,000 for standard areas). TEAs fall into two statutory categories:\n1. **Rural Area**: Located outside a Metropolitan Statistical Area (MSA) and outside any municipality with a population of 20,000 or more.\n2. **High Unemployment Area (HUA)**: An area experiencing unemployment of at least 150% of the national average, designated strictly by USCIS using census tracts.\n\nDesignated Infrastructure projects also qualify for the $800,000 minimum threshold.',
    tags: ['TEA', 'targeted employment area', 'rural', 'high unemployment', 'infrastructure', '$800,000 threshold'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-7',
    category: 'Process & Timeline',
    question: 'What are the reserved visa set-asides and why are they critical for India and China?',
    answer: 'The RIA of 2022 established **32% of annual EB-5 visas** reserved in priority set-aside categories:\n• **20% for Rural Area Projects**\n• **10% for High Unemployment Area (HUA) Projects**\n• **2% for Public Infrastructure Projects**\n\n**Why this matters**: These set-aside categories are currently designated as **"Current"** on the monthly USCIS Visa Bulletin. Applicants from backlogged countries like **India** and **China** can bypass years of legacy visa queues by choosing a set-aside project, locking in immediate priority status.',
    tags: ['set-aside', 'reserved visas', 'visa bulletin', 'india', 'china', 'backlog', 'retrogression', 'priority dates', 'queue'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-8',
    category: 'Process & Timeline',
    question: 'Why do Rural EB-5 projects offer the fastest priority processing?',
    answer: 'Under Section 203 of RIA 2022, USCIS is legally mandated to provide **Priority Processing** for Form I-526E petitions filed in Rural TEA projects. While standard petitions can take 24–48 months, Rural I-526E petitions are routinely approved in **6 to 12 months** (with some recorded approvals in under 6 months).\n\nCombined with the 20% reserved visa quota, Rural projects represent the fastest pathway to U.S. Green Cards available under EB-5 today.',
    tags: ['rural priority', 'fastest', 'priority processing', 'rural approval', 'speed', 'processing time', '6 months'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 3. Concurrent Filing & U.S. Status (H-1B, L-1, F-1 OPT) ─────────────────
  {
    id: 'kb-9',
    category: 'Process & Timeline',
    question: 'What is Concurrent Filing and can I file I-526E and I-485 at the same time?',
    answer: 'Yes! One of the most powerful provisions of RIA 2022 is **Concurrent Filing**. If you are physically present in the United States on a lawful nonimmigrant visa (such as **H-1B, L-1, F-1 OPT, O-1, or E-2**), you can file Form I-526E (EB-5 petition) and Form I-485 (Adjustment of Status to Permanent Resident) simultaneously.\n\nAlong with Form I-485, you file **Form I-765 (Employment Authorization Document / EAD)** and **Form I-131 (Advance Parole travel document)**. This grants you open work and travel rights while your green card petition is being adjudicated.',
    tags: ['concurrent filing', 'I-485', 'adjustment of status', 'I-765', 'I-131', 'EAD', 'work permit', 'advance parole'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-10',
    category: 'Process & Timeline',
    question: 'How fast can an H-1B or F-1 visa holder receive an EAD work permit via EB-5 concurrent filing?',
    answer: 'Upon filing Form I-485 concurrently with Form I-526E, USCIS typically issues the standalone **EAD work permit (Form I-765) in approximately 60 to 180 days** (2 to 6 months).\n\nThis "combo card" or EAD allows you to work for **any U.S. employer**, start your own company, work multiple jobs, or take career sabbaticals without being tethered to an H-1B sponsor or PERM labor certification.',
    tags: ['h-1b', 'h1b to eb5', 'ead timeline', 'how fast ead', 'work permit timeline', 'f-1 opt', 'open work permit'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-11',
    category: 'General EB-5',
    question: 'Can I travel internationally while my EB-5 concurrent filing is pending?',
    answer: 'If you file Form I-485 Adjustment of Status, you should **not travel outside the United States** until your **Advance Parole (Form I-131)** travel document is approved, unless you maintain a valid dual-intent visa status such as **H-1B or L-1** with an unexpired visa stamp in your passport.\n\nLeaving the U.S. without valid Advance Parole or dual-intent status can cause USCIS to consider your I-485 petition abandoned. Always consult your immigration attorney prior to booking international travel.',
    tags: ['travel', 'international travel', 'advance parole', 'leaving us', 'h-1b travel', 'abandonment'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 4. Job Creation & Regional Centers ─────────────────────────────────────
  {
    id: 'kb-12',
    category: 'Job Creation',
    question: 'How many jobs must an EB-5 investment create and how are they counted?',
    answer: 'Every EB-5 investment must create or preserve at least **10 full-time jobs** (minimum 35 hours/week) for qualifying U.S. workers for at least 2 years.\n\n• **In Regional Center Investments**: The 10 jobs can include **direct, indirect, and induced jobs** derived from economic modeling (IMPLAN or RIMS II) based on construction expenditures and operational revenue. Direct W-2 hiring by the investor is not required.\n• **In Direct Investments**: Only direct, permanent W-2 employees hired directly by the investor\'s business qualify.',
    tags: ['jobs', '10 jobs', 'job creation', 'indirect jobs', 'induced jobs', 'W-2', 'implan', 'rims ii'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-13',
    category: 'Regional Centers',
    question: 'What is a USCIS-approved Regional Center and why do 95% of investors choose them?',
    answer: 'A Regional Center is an economic entity designated by USCIS to pool foreign capital for large-scale economic development projects (such as real estate, energy, infrastructure, or hospitality).\n\nOver 95% of EB-5 investors choose Regional Centers because:\n1. **Indirect & Induced Job Creation**: Allows construction spending to satisfy the 10-job requirement.\n2. **Passive Investment**: Investors are limited partners and do not manage day-to-day business operations.\n3. **Higher Approval Certainty**: Reputable regional centers build in a 20% to 50%+ job creation cushion.',
    tags: ['regional center', 'why regional center', 'passive', 'job cushion', 'benefits of regional center'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-14',
    category: 'Regional Centers',
    question: 'What is Form I-956F and why should I choose an I-956F approved project?',
    answer: 'Form I-956F (Application for Approval of an Investment in a Commercial Enterprise) is the formal project application submitted to USCIS by a Regional Center under RIA 2022.\n\nWhen a project receives **I-956F approval**, USCIS has formally vetted and approved the business plan, economic job-creation model, and TEA designation. Individual investor I-526E petitions filed under an approved I-956F enjoy significantly faster processing and near-zero risk of project-level denial.',
    tags: ['I-956F', 'project exemplar', 'project approval', 'exemplar', 'I-956F approved'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 5. Source of Funds (SOF) & Path of Capital ─────────────────────────────
  {
    id: 'kb-15',
    category: 'Source of Funds',
    question: 'What sources of funds are acceptable to fund the $800,000 EB-5 investment?',
    answer: 'USCIS permits any lawful capital source, provided there is an exhaustive paper trail documenting origin and path. Common acceptable sources include:\n• **Ordinary Employment Income & Bonuses**: Accumulated salary, stock options, RSU vests.\n• **Real Estate Sales**: Capital proceeds from selling residential or commercial property.\n• **Business Ownership / Dividends**: Profits, capital distributions, or sale of business shares.\n• **Unconditional Gifts**: Gifted capital from parents, spouse, siblings, or third parties (donor\'s source of wealth must be proven).\n• **Inheritances**: Lawfully distributed estate assets.\n• **Mortgages / Secured Bank Loans**: Loans secured by personal assets owned by the investor.',
    tags: ['source of funds', 'SOF', 'eligible funds', 'property sale', 'gifts', 'stocks', 'dividends', 'inheritance', 'salary'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-16',
    category: 'Source of Funds',
    question: 'Can I use a gift from family members or parents to fund my EB-5 investment?',
    answer: 'Yes! Gifting is one of the most common methods for funding EB-5, especially for young professionals or students in the U.S. on F-1/H-1B visas.\n\nThe gift must be irrevocable and confirmed via a signed Gift Deed. USCIS requires complete documentation demonstrating that the **donor** earned the gifted capital through lawful means (e.g., tax returns, business dividends, property sale, or retirement accounts). There is no tax penalty from USCIS for using gifted capital.',
    tags: ['gift', 'gift deed', 'parents gift', 'family gift', 'donor', 'gift tax', 'student funding'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-17',
    category: 'Source of Funds',
    question: 'Can I take a bank loan or home equity loan to fund the $800,000?',
    answer: 'Yes. Under RIA 2022 and modern USCIS precedents, loan proceeds can be used for EB-5 capital. Loans secured by personal assets (such as real estate, investment portfolios, or business equity) are fully eligible.\n\nUnsecured loans from legitimate banking institutions are also accepted provided the borrower is personally liable and the funds were not borrowed from the Regional Center or project developer.',
    tags: ['loan', 'mortgage', 'home equity', 'secured loan', 'bank loan', 'borrowing'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-18',
    category: 'Source of Funds',
    question: 'How do Indian investors navigate the RBI Liberalised Remittance Scheme (LRS) $250k limit?',
    answer: 'Under the Reserve Bank of India (RBI) LRS guidelines, a single Indian citizen can remit up to **$250,000 per financial year**.\n\nTo remit $800,000, Indian families typically combine the individual quotas of multiple family members (e.g., investor, spouse, and parents/children: 4 people × $250,000 = $1,000,000). Alternatively, remittances can be staged across two Indian financial years (March and April). Shoora EB-5 works closely with authorized foreign exchange partners to ensure strict compliance with FEMA and TCS regulations.',
    tags: ['india remittance', 'LRS', 'RBI', 'remittance', 'TCS', '$250k limit', 'FEMA', 'transfer from india'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 6. Full Roadmap & Path to U.S. Citizenship ─────────────────────────────
  {
    id: 'kb-19',
    category: 'Process & Timeline',
    question: 'What is the full roadmap from initial filing to U.S. Citizenship (Passport)?',
    answer: 'The complete EB-5 journey consists of 4 main phases:\n1. **Form I-526E Petition**: Prepared by your immigration attorney and filed with USCIS. (Rural projects: ~6-12 months; HUA projects: ~18-30 months).\n2. **Conditional Green Card (2-Year Status)**: Received via Adjustment of Status (Form I-485 in U.S.) or Consular Interview (DS-260 overseas).\n3. **Form I-829 (Removal of Conditions)**: Filed within the 90 days prior to the 2-year anniversary to prove the 10 jobs were created and funds sustained. Approval grants your **Unconditional 10-Year Permanent Green Card**.\n4. **U.S. Citizenship (Form N-400)**: Eligible to apply for naturalization after holding permanent resident status for **5 years** (counting from the date your initial 2-year green card was issued).',
    tags: ['roadmap', 'timeline', 'citizenship', 'passport', 'I-526E', 'I-829', 'I-485', 'N-400', 'milestones'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-20',
    category: 'Process & Timeline',
    question: 'What is the difference between Consular Processing and Adjustment of Status?',
    answer: '• **Adjustment of Status (AOS / Form I-485)**: Available if you are already living lawfully inside the United States on another visa (e.g. H-1B, L-1, F-1). You remain in the U.S. and receive work and travel permits while waiting.\n• **Consular Processing (Form DS-260)**: Used if you reside outside the United States. Once your Form I-526E is approved and your visa is current, your file is transferred to the National Visa Center (NVC), and you attend a final immigrant visa interview at your local U.S. Embassy or Consulate.',
    tags: ['consular processing', 'adjustment of status', 'I-485', 'DS-260', 'nvc', 'embassy interview'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-21',
    category: 'Process & Timeline',
    question: 'What happens at the Form I-829 stage and why is it important?',
    answer: 'Form I-829 is the final immigration petition filed in the EB-5 process, submitted between 21 and 24 months after receiving your initial 2-year conditional green card.\n\nIts sole purpose is to demonstrate to USCIS that:\n1. Your capital was deployed and sustained in the enterprise for the required period.\n2. The project created the required 10 full-time jobs for U.S. workers.\n\nOnce Form I-829 is approved, all conditions are removed and you and your family receive permanent, unconditional **10-year Green Cards**.',
    tags: ['I-829', 'removal of conditions', 'permanent green card', '10 year green card', 'conditional green card'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 7. Family Eligibility & Child Protection (CSPA) ────────────────────────
  {
    id: 'kb-22',
    category: 'General EB-5',
    question: 'Who in my family is included under a single $800,000 EB-5 investment?',
    answer: 'A single $800,000 EB-5 petition covers:\n• The **Principal Investor**\n• Their **Legal Spouse**\n• All **Unmarried Children under 21 years of age** at the time of filing.\n\nAll qualifying family members receive green cards simultaneously with all permanent resident rights, including in-state tuition eligibility at leading U.S. universities, unrestricted work rights, and access to medical residencies and restricted careers.',
    tags: ['family', 'spouse', 'children', 'under 21', 'dependents', 'kids', 'family green card', 'in-state tuition'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-23',
    category: 'General EB-5',
    question: 'How does the Child Status Protection Act (CSPA) prevent my child from aging out?',
    answer: 'Under the Child Status Protection Act (CSPA), a child\'s biological age is effectively **"frozen"** on the date Form I-526E is properly received by USCIS, provided visa numbers remain available.\n\nThe time the I-526E petition spends pending with USCIS is subtracted from the child\'s biological age when determining final green card eligibility. To maximize CSPA protection for children approaching age 21, filing under a **"Current" reserved set-aside category** (Rural or HUA) is strongly recommended.',
    tags: ['CSPA', 'aging out', 'child age', '21 years old', 'child protection', 'kids aging out'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-24',
    category: 'General EB-5',
    question: 'Can my child over 21 file as the primary EB-5 applicant using gifted funds?',
    answer: 'Yes! If an adult child is 21 or older, they cannot be included as a dependent on a parent\'s application. However, parents can **gift $800,000** to the child, who then files Form I-526E as the **primary applicant**.\n\nThis is widely used by parents of international students attending U.S. colleges or working on OPT, enabling the student to secure an open EAD work permit and green card independently.',
    tags: ['child over 21', 'adult child', 'student applicant', 'primary applicant', 'college student', 'opt green card'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 8. Risk Management, Escrow & Project Due Diligence ─────────────────────
  {
    id: 'kb-25',
    category: 'Regional Centers',
    question: 'What happens to my $800,000 if USCIS denies my Form I-526E petition?',
    answer: 'Reputable Regional Center projects incorporate an **Escrow Refund Agreement** or project refund guaranty.\n\nIf an investor\'s I-526E petition is denied by USCIS for any reason (including individual source-of-funds issues), the escrow agent or developer is contractually obligated to refund the full $800,000 capital (and typically the administrative fee) back to the investor within a specified timeframe (commonly 30 to 90 days). Shoora EB-5 only selects projects offering ironclad denial refund protections.',
    tags: ['denial', 'refund', 'escrow refund', 'what if denied', 'rejection', 'money back'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-26',
    category: 'Regional Centers',
    question: 'How should an investor evaluate and conduct due diligence on an EB-5 project?',
    answer: 'Key due diligence criteria every investor must evaluate include:\n1. **Job Cushion**: Does the project model generate at least 20% to 50% more jobs than the required 10 jobs per investor?\n2. **Capital Stack Structure**: What percentage is senior bank debt vs developer equity vs EB-5? (EB-5 should ideally represent <30% of total capital).\n3. **Developer Track Record**: Does the developer have a completed history of projects without defaults or foreclosures?\n4. **Regional Center Track Record**: Has the sponsor achieved 100% I-526 and I-829 approval rates and returned capital to past investors?\n5. **I-956F Status**: Has USCIS already reviewed and approved the project exemplar?\n6. **Exit & Repayment Security**: What is the collateral, mortgage lien, or refinancing plan to return capital?',
    tags: ['due diligence', 'vetting', 'evaluating projects', 'project selection', 'capital stack', 'job cushion', 'checklist'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-27',
    category: 'Process & Timeline',
    question: 'What is the RIA 2022 grandfathering clause and how does it protect investors?',
    answer: 'Under the RIA of 2022, Congress enacted a permanent statutory **"Grandfathering Protection"** for all EB-5 investors who file their petitions on or before **September 30, 2026**.\n\nThis means that even if the regional center program encounters future legislative delays or lapses after 2026, USCIS is legally bound to continue processing and adjudicating all timely filed petitions to completion. Your immigration petition cannot be canceled due to program expiration.',
    tags: ['grandfathering', 'protection', 'september 2026', 'RIA protection', 'expiration', 'program lapse'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 9. Tax Planning & U.S. Green Card Holder Obligations ───────────────────
  {
    id: 'kb-28',
    category: 'General EB-5',
    question: 'What are the U.S. tax implications once I receive an EB-5 Green Card?',
    answer: 'Once you become a U.S. Permanent Resident (green card holder), you are subject to **U.S. worldwide income taxation**. You must report worldwide earnings, interest, capital gains, and foreign bank accounts (via FBAR and FATCA).\n\n**Pre-Immigration Tax Planning**: Before activating your green card or landing as a permanent resident, high-net-worth investors frequently consult international tax counsel to restructure foreign business holdings, realize capital gains abroad tax-free, and establish foreign grantor trusts to shield family assets from U.S. gift and estate taxes.',
    tags: ['tax', 'taxes', 'worldwide income', 'pre-immigration tax', 'fbar', 'fatca', 'irs', 'tax planning'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-29',
    category: 'General EB-5',
    question: 'How do I maintain my U.S. Green Card if I have business or family overseas?',
    answer: 'As a U.S. permanent resident, you are expected to maintain the United States as your primary permanent home. General requirements:\n• Do not remain outside the U.S. for longer than **180 consecutive days** without valid ties.\n• If you need to remain abroad for 1 to 2 years (e.g. winding down an overseas business), apply for a **Re-entry Permit (Form I-131)** prior to leaving the U.S.\n• File annual U.S. federal tax returns as a resident and maintain physical ties (residence, bank accounts, driver\'s license).',
    tags: ['maintain green card', 'living outside us', 're-entry permit', 'staying abroad', 'travel restrictions'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },

  // ─── 10. Shoora EB-5 Advisory Services & Process ────────────────────────────
  {
    id: 'kb-30',
    category: 'Custom Replies',
    question: 'What is Shoora EB-5 and what services does your firm provide?',
    answer: 'Shoora EB-5 is a dedicated, boutique **U.S. Immigrant Investor Advisory Firm**. We provide end-to-end guidance for families, corporate executives, and high-net-worth investors seeking lawful U.S. Permanent Residency through the EB-5 program.\n\nOur advisory services include:\n• **Institutional Due Diligence**: Independent financial and immigration risk analysis on top-tier EB-5 projects.\n• **TEA & Set-Aside Strategy**: Identifying optimal Rural and HUA projects for fast priority processing.\n• **Source-of-Funds Structuring**: Advisory roadmaps coordinating complex cross-border financial documentation.\n• **Immigration Attorney Referrals**: Connecting investors with premier, AILA-certified EB-5 attorneys.\n• **Milestone Monitoring**: Ongoing tracking of capital deployment, job creation reports, and I-526E/I-829 filings.',
    tags: ['who is shoora', 'about shoora', 'shoora eb5', 'services', 'what do you do', 'advisory firm', 'consulting'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-31',
    category: 'Custom Replies',
    question: 'How does Shoora EB-5 select and vet investment projects?',
    answer: 'Shoora EB-5 applies a rigorous **5-Pillar Institutional Screening Framework**:\n1. **Immigration Safety**: Mandatory >25% job creation cushion and I-956F filing/approval status.\n2. **Targeted Employment Area (TEA)**: Strict compliance with federal rural or high-unemployment tract requirements.\n3. **Capital Stack Health**: Developer equity committed, institutional senior construction debt in place, and EB-5 representing a minority position.\n4. **Developer Track Record**: Decades of successful execution without historical project defaults.\n5. **Exit Mechanism**: Clearly structured repayment terms, property appraisal backing, and defined refinancing horizons.',
    tags: ['project selection', 'how shoora vets', 'due diligence process', 'screening', 'safety standards'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-32',
    category: 'Custom Replies',
    question: 'Does Shoora EB-5 charge prospective investors for an initial consultation?',
    answer: 'No. Shoora EB-5 provides **complimentary, confidential initial consultations** to qualified investors.\n\nDuring your consultation, our senior advisors will evaluate:\n• Your current U.S. immigration status and family timeline.\n• Country quota dynamics (India, China, Vietnam, Rest of World).\n• Feasibility of available source-of-funds assets.\n• Available Tier-1 Rural and Urban TEA project allocations.',
    tags: ['consultation fee', 'is it free', 'free consultation', 'cost of consultation', 'charges'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-33',
    category: 'Custom Replies',
    question: 'How do I book a private consultation with a Shoora EB-5 advisor?',
    answer: 'You can book your consultation right here! Simply provide your **Full Name, Email Address, and Phone Number** in this chat window or via the consultation card on your screen.\n\nOnce submitted, you will verify your mobile number with a quick SMS code, and our Senior Advisory Desk will contact you within 24 hours to schedule a confidential video or telephone consultation.',
    tags: ['book consultation', 'schedule call', 'contact advisor', 'appointment', 'speak to human', 'talk to advisor', 'how to start'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-34',
    category: 'Custom Replies',
    question: 'How does Shoora EB-5 ensure the confidentiality of my personal and financial information?',
    answer: 'Shoora EB-5 adheres to strict data privacy and institutional confidentiality protocols:\n• All investor communications and records are encrypted with 256-bit SSL protocols.\n• Non-Disclosure Agreements (NDAs) are executed prior to reviewing sensitive source-of-funds or personal financial documents.\n• We never sell, lease, or share investor contact records with unauthorized third parties.',
    tags: ['privacy', 'confidentiality', 'security', 'data security', 'nda', 'safe'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-35',
    category: 'General EB-5',
    question: 'Can I do EB-5 if I was previously rejected for an H-1B, F-1, or B-1/B-2 visa?',
    answer: 'In general, yes. Prior visa denials under Section 214(b) (failure to demonstrate non-immigrant intent) do **not** disqualify you from EB-5, because EB-5 is an immigrant visa where immigrant intent is explicitly expected and lawful.\n\nHowever, prior denials based on fraud, misrepresentation (Section 212(a)(6)(C)), or criminal history require specialized review by an immigration attorney to determine waiver eligibility.',
    tags: ['visa denial', '214b', 'rejected visa', 'h-1b rejection', 'previous denial', 'eligibility with denial'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-36',
    category: 'General EB-5',
    question: 'How does EB-5 compare to the EB-2 or EB-3 employment-based green card routes?',
    answer: 'For nationals of India and China, the EB-2 and EB-3 backlog exceeds 10 to 50+ years due to per-country quota limitations and employer-tied PERM labor certification requirements.\n\n**EB-5 advantages**:\n• **No Employer Sponsorship**: You are self-petitioned and in full control of your petition.\n• **Immediate Reserved Quotas**: Rural (20%) and HUA (10%) set-aside categories bypass the multi-decade line.\n• **Immediate Work & Travel**: Concurrent filing delivers open work permits in months, eliminating H-1B dependency.',
    tags: ['eb2 vs eb5', 'eb3 vs eb5', 'comparison', 'perm', 'employer sponsorship', 'h1b backlog'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-37',
    category: 'Process & Timeline',
    question: 'What is the current USCIS processing time for Form I-526E?',
    answer: 'Processing times vary significantly based on project category:\n• **Rural TEA Projects**: Under statutory priority processing, approvals are currently averaging **6 to 12 months** (with some approved in under 6 months).\n• **High Unemployment Area (HUA) Projects**: Averages **18 to 30 months**.\n• **Legacy Unreserved Petitions**: Averages **36 to 48+ months**.\n\nShoora EB-5 strongly advises investors seeking rapid outcomes to prioritize qualifying Rural TEA projects.',
    tags: ['processing time', 'how long', 'i-526e timeline', 'uscis timeline', 'wait time', 'approval speed'],
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
      if (parsed.length < DEFAULT_KNOWLEDGE_BASE.length) {
        const merged = [...parsed]
        for (const def of DEFAULT_KNOWLEDGE_BASE) {
          if (!merged.some(m => m.id === def.id || m.question.toLowerCase().trim() === def.question.toLowerCase().trim())) {
            merged.push(def)
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        return merged
      }
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
// ─── Customer Reply Matcher ──────────────────────────────────────────────────
// Evaluates customer input against active Knowledge Base items and returns the best matching reply.

const SYNONYMS: Record<string, string[]> = {
  'minimum investment': ['how much', 'cost', 'price', 'minimum', 'amount', '$800k', '$800,000', '800000', 'investment amount', 'capital required', 'how much money', 'fees'],
  'rural priority': ['rural', 'fastest', 'speed', 'quickest', 'priority processing', 'fast track', '6 months', 'expedited'],
  'concurrent filing': ['concurrent', 'h1b', 'h-1b', 'f-1', 'f1', 'opt', 'l-1', 'l1', 'adjustment of status', 'i-485', 'i485', 'switch job', 'open work permit'],
  'work permit timeline': ['ead', 'work permit', 'i-765', 'combo card', 'advance parole', 'travel permit', 'how long ead', 'ead time'],
  'family': ['kids', 'children', 'spouse', 'wife', 'husband', 'son', 'daughter', 'dependents', 'child', 'family green card', 'in-state tuition'],
  'aging out': ['cspa', '21 years old', 'age limit', 'turning 21', 'freeze age'],
  'refund': ['return of capital', 'repay', 'repayment', 'money back', 'denial', 'what if denied', 'rejection', 'exit strategy', 'guarantee'],
  'jobs': ['10 jobs', 'job creation', 'indirect jobs', 'w2', 'w-2', 'economic model', 'implan'],
  'source of funds': ['sof', 'proof of funds', 'gift', 'gift deed', 'loan', 'property sale', 'inheritance', 'stocks', 'salary', 'savings', 'legal money'],
  'india remittance': ['india', 'lrs', 'rbi', 'remit', 'tcs', 'fema', 'transfer money from india', '250k'],
  'roadmap': ['timeline', 'steps', 'process', 'how long to green card', 'citizenship', 'passport', 'n-400', 'i-829', 'permanent green card'],
  'about shoora': ['who is shoora', 'what is shoora', 'shoora', 'about you', 'your firm', 'services', 'why shoora', 'agency'],
  'book consultation': ['consultation', 'book', 'schedule', 'call', 'appointment', 'advisor', 'speak to human', 'talk to someone', 'contact number'],
}

export function findKnowledgeBaseReply(userQuery: string): { reply: string; matchedItem: KnowledgeBaseItem } | null {
  const q = userQuery.toLowerCase().trim()
  if (!q) return null

  // Handle common greetings directly
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|namaste|greetings|start)(\s*!*)?$/i.test(q)) {
    return {
      reply: 'Hello and welcome to **Shoora EB-5**! I am your Senior EB-5 Investment Advisor.\n\nI can assist you with comprehensive guidance on:\n• **$800,000 TEA & Rural Investment Opportunities**\n• **Concurrent Filing (EAD & Advance Parole in 60–180 days for H-1B / F-1)**\n• **Source-of-Funds Structuring & Gift Deeds**\n• **Family Green Card & CSPA Child Protection**\n• **Booking a 1-on-1 Confidential Advisory Consultation**\n\nHow can I assist your EB-5 immigration journey today?',
      matchedItem: {
        id: 'kb-greeting',
        category: 'Custom Replies',
        question: 'Welcome Greeting',
        answer: 'Hello and welcome to Shoora EB-5! How can I assist you today?',
        tags: ['greeting', 'hi', 'hello'],
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  const items = getKnowledgeBaseItems().filter(i => i.isActive)

  let bestMatch: KnowledgeBaseItem | null = null
  let highestScore = 0

  for (const item of items) {
    let score = 0
    const lowerQ = item.question.toLowerCase()
    const lowerA = item.answer.toLowerCase()

    // 1. Direct or substring matches
    if (lowerQ === q) {
      score += 100
    } else if (lowerQ.includes(q) || q.includes(lowerQ)) {
      score += 50
    }

    // 2. Tag matching with weight
    for (const tag of item.tags) {
      const lowerTag = tag.toLowerCase()
      if (q === lowerTag) {
        score += 40
      } else if (q.includes(lowerTag)) {
        score += 25 + lowerTag.length
      }
    }

    // 3. Synonym dictionary matching
    for (const [concept, synList] of Object.entries(SYNONYMS)) {
      const itemHasConcept = item.tags.some(t => t.toLowerCase().includes(concept)) || lowerQ.includes(concept)
      if (itemHasConcept) {
        for (const syn of synList) {
          if (q.includes(syn)) {
            score += 22
          }
        }
      }
    }

    // 4. Token boundary matches
    const words = q.split(/[\s,?.!-]+/).filter(w => w.length > 2)
    for (const word of words) {
      if (lowerQ.includes(word)) {
        score += 8
      } else if (lowerA.includes(word)) {
        score += 3
      }
    }

    if (score > highestScore && score >= 14) {
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

