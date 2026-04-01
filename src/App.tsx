import { useState, useEffect, useRef } from 'react'

// ─── BRAND ────────────────────────────────────────────────────────────────────
const BRAND = {
  navy:       '#1a2744',
  navyLight:  '#2d3f6b',
  gold:       '#c9a84c',
  goldLight:  '#fdf6e3',
  cream:      '#faf8f3',
  muted:      '#6b7280',
  white:      '#ffffff',
  green:      '#16a34a',
  greenLight: '#f0fdf4',
  border:     '#e5e0d5',
  red:        '#dc2626',
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const REDIRECT = {
  parentOK: 'https://15-cles-parents.trari-pedagogie.com',
  proOK:    'https://15-cles-pro.trari-pedagogie.com',
  parentKO: 'https://ressources.trari-pedagogie.com/3-exercices-parents',
  proKO:    'https://ressources.trari-pedagogie.com/3-exercices-professionnels',
}
const VPS_ENDPOINT = 'http://204.168.143.240:8080/sas-lead'
const ADMIN_PASSWORD = 'trari2026admin'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Persona = 'parent' | 'pro' | null
type Step = 'splash' | 'name' | 'child_name' | 'questions' | 'email_capture' | 'analyzing' | 'results' | 'admin_login' | 'admin_dashboard'

interface Option  { id: string; label: string; points: number; icon: string; detail?: string }
interface Question { id: string; text: string; sub?: string; options: Option[]; socialProof?: string }
interface Answer  { qId: string; optId: string; points: number; label: string }
interface Lead    { id: string; ts: string; prenom: string; enfant?: string; email: string; persona: Persona; score: number; level: 'A'|'B'|'C'; answers: Answer[]; pain: string }

// ─── QUESTIONS PARENTS ────────────────────────────────────────────────────────
const Q_PARENT = (prenom: string, enfant: string): Question[] => [
  {
    id: 'p_situation',
    text: `Comment décririez-vous la situation d'${enfant || 'votre enfant'} avec l’écriture ?`,
    sub: 'Choisissez ce qui lui ressemble le plus en ce moment.',
    options: [
      { id: 'a', label: 'Il écrit, mais lentement — il se fatigue très vite', points: 15, icon: '🐢', detail: 'Crampes, poignet douloureux, stylo lâché en cours' },
      { id: 'b', label: 'Son écriture est illisible ou très chaotique', points: 20, icon: '📄', detail: 'Les maîtres font des remarques, il se fait corriger' },
      { id: 'c', label: 'Il refuse d’écrire — c’est devenu une source de conflits', points: 25, icon: '😤', detail: 'Crise à chaque devoir, larmes, découragement' },
      { id: 'd', label: 'Il souffre physiquement ou a perdu toute confiance', points: 30, icon: '💙', detail: 'Douleurs, crampes, "je suis nul, j’y arriverai jamais"' },
    ],
    socialProof: '76 % des parents qui nous contactent décrivent le refus ou le découragement.',
  },
  {
    id: 'p_attempts',
    text: `Qu’avez-vous déjà essayé pour aider ${enfant || 'votre enfant'} ?`,
    sub: 'Soyez honnête — tout point de départ est valable.',
    options: [
      { id: 'a', label: 'Je commence tout juste à chercher', points: 5,  icon: '🔍' },
      { id: 'b', label: 'J’ai regardé des vidéos, lu des articles', points: 10, icon: '💻' },
      { id: 'c', label: 'J’ai essayé des exercices à la maison', points: 15, icon: '✏️' },
      { id: 'd', label: 'J’ai déjà consulté un orthophoniste, ergo… ou payé une aide', points: 25, icon: '👩‍⚕️', detail: 'Rien n’a vraiment duré' },
    ],
  },
  {
    id: 'p_timing',
    text: 'Depuis combien de temps est-ce que ça vous préoccupe ?',
    options: [
      { id: 'a', label: 'Quelques semaines — je viens de m’en rendre compte', points: 10, icon: '🗓️' },
      { id: 'b', label: 'Plusieurs mois',                                         points: 20, icon: '📅' },
      { id: 'c', label: 'Plus d’un an — ça n’avance pas',                         points: 30, icon: '⏳', detail: 'Et ça pèse de plus en plus sur l’ambiance à la maison' },
    ],
    socialProof: 'Plus le problème dure, plus l’impact sur la confiance est important. 10 min/jour peuvent tout changer.',
  },
  {
    id: 'p_dispo',
    text: 'Combien de temps par jour pouvez-vous y consacrer ?',
    sub: 'La méthode est conçue pour fonctionner en 10 minutes. Pas besoin de plus.',
    options: [
      { id: 'a', label: 'Franchement, moins de 5 minutes — je suis très pris·e', points: 5,  icon: '⚡' },
      { id: 'b', label: '10 minutes — c’est faisable',                              points: 20, icon: '✅' },
      { id: 'c', label: '15 à 30 minutes — je suis disponible',                     points: 15, icon: '🕐' },
      { id: 'd', label: 'Autant qu’il faudra — ma priorité c’est mon enfant',        points: 20, icon: '💪' },
    ],
  },
]

// ─── QUESTIONS PROS ───────────────────────────────────────────────────────────
const Q_PRO = (prenom: string): Question[] => [
  {
    id: 'pro_context',
    text: 'Dans quel cadre accompagnez-vous principalement les enfants ?',
    sub: 'Votre contexte nous aide à vous orienter vers ce qui sera le plus utile.',
    options: [
      { id: 'a', label: 'En classe — maternelle ou primaire',                     points: 15, icon: '🏫' },
      { id: 'b', label: 'En suivi individuel (cabinet, domicile)',                 points: 20, icon: '🏥', detail: 'Ortho, ergo, psychomot, graphothérapeute…' },
      { id: 'c', label: 'En structure spécialisée (IME, SESSAD, RASED…)',          points: 20, icon: '🌟' },
      { id: 'd', label: 'Autre contexte (formation adultes, accompagnement scolaire…)', points: 10, icon: '📚' },
    ],
  },
  {
    id: 'pro_challenge',
    text: 'Quel est votre principal blocage face aux enfants qui n’arrivent pas à écrire ?',
    sub: 'Choisissez ce qui reflète le mieux votre quotidien.',
    options: [
      { id: 'a', label: 'Je manque d’outils concrets et structurés à leur proposer', points: 25, icon: '🔧' },
      { id: 'b', label: 'Je ne sais pas toujours par où commencer avec chaque profil', points: 20, icon: '🗺️' },
      { id: 'c', label: 'Les progrès sont lents et j’ai du mal à les maintenir motivés', points: 20, icon: '📉' },
      { id: 'd', label: 'Je cherche à me différencier et proposer une approche reconnue', points: 15, icon: '🎯' },
    ],
    socialProof: '9 professionnels sur 10 manquent d’une méthode structurée — pas de formation initiale sur la graphomotricité.',
  },
  {
    id: 'pro_timing',
    text: 'Quand souhaitez-vous mettre en place une nouvelle approche ?',
    options: [
      { id: 'a', label: 'Dans 6 mois ou plus — je me renseigne',               points: 5,  icon: '🔭' },
      { id: 'b', label: 'Dans les 3 prochains mois',                            points: 15, icon: '📅' },
      { id: 'c', label: 'Dans le mois qui vient',                               points: 25, icon: '🗓️' },
      { id: 'd', label: 'Dès maintenant — j’ai des enfants qui en ont besoin',  points: 30, icon: '⚡', detail: 'Ma prochaine séance est dans quelques jours' },
    ],
  },
  {
    id: 'pro_formation',
    text: 'Avez-vous déjà suivi une formation sur la graphomotricité ?',
    options: [
      { id: 'a', label: 'Non — c’est ma première démarche',                           points: 10, icon: '🌱' },
      { id: 'b', label: 'J’ai lu des livres ou des articles spécialisés',             points: 15, icon: '📖' },
      { id: 'c', label: 'J’ai fait une formation courte (1 à 2 jours)',               points: 20, icon: '📋' },
      { id: 'd', label: 'Plusieurs formations, mais je cherche une méthode complète', points: 25, icon: '🎯', detail: 'Quelque chose d’applicable dès la prochaine séance' },
    ],
  },
]

// ─── UTILS ────────────────────────────────────────────────────────────────────
function getLevel(score: number): 'A'|'B'|'C' {
  return score >= 70 ? 'A' : score >= 40 ? 'B' : 'C'
}

function getPain(answers: Answer[], persona: Persona): string {
  const first = answers[0]
  if (!first) return ''
  if (persona === 'parent') {
    const map: Record<string,string> = {
      a: 'fatigue et lenteur',
      b: 'écriture illisible',
      c: 'refus d’écrire',
      d: 'douleur physique et perte de confiance',
    }
    return map[first.optId] || ''
  } else {
    const map: Record<string,string> = {
      a: 'manque d’outils concrets',
      b: 'pas de point de départ clair',
      c: 'maintien de la motivation',
      d: 'différenciation professionnelle',
    }
    return map[first.optId] || ''
  }
}

async function sendToVPS(lead: Lead) {
  try {
    await fetch(VPS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors',
      body: JSON.stringify(lead),
    })
  } catch (e) {
    // silent — don’t block UX
  }
}

function saveLeadLocally(lead: Lead) {
  try {
    const existing: Lead[] = JSON.parse(localStorage.getItem('sas_leads') || '[]')
    existing.unshift(lead)
    localStorage.setItem('sas_leads', JSON.stringify(existing.slice(0, 200)))
  } catch {}
}

function getLocalLeads(): Lead[] {
  try {
    return JSON.parse(localStorage.getItem('sas_leads') || '[]')
  } catch { return [] }
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: BRAND.navy,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'Playfair Display', serif", color: BRAND.gold, fontSize: 20, fontWeight: 700 }}>T</span>
      </div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: BRAND.navy, lineHeight: 1 }}>
          Samirra Trari
        </div>
        <div style={{ fontSize: 11, color: BRAND.muted, letterSpacing: '0.05em', marginTop: 2 }}>
          Méthode 15 Clés · Graphopédagogue
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ height: 5, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${BRAND.navy}, ${BRAND.gold})`,
          borderRadius: 99,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 11, color: BRAND.muted }}>Question {step} sur {total}</span>
        <span style={{ fontSize: 11, color: BRAND.gold, fontWeight: 600 }}>{pct}%</span>
      </div>
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: BRAND.white, borderRadius: 20, padding: '24px',
      boxShadow: '0 2px 16px rgba(26,39,68,0.07)',
      border: `1px solid ${BRAND.border}`,
      ...style,
    }}>
      {children}
    </div>
  )
}

function OptionBtn({
  option, selected, onSelect, disabled,
}: {
  option: Option; selected: boolean; onSelect: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      style={{
        width: '100%', textAlign: 'left',
        padding: '14px 16px', borderRadius: 14,
        border: `2px solid ${selected ? BRAND.gold : BRAND.border}`,
        background: selected ? BRAND.goldLight : BRAND.white,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        transition: 'all 0.18s',
        boxShadow: selected ? `0 0 0 3px ${BRAND.gold}22` : 'none',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0, width: 28, textAlign: 'center', marginTop: 1 }}>
        {option.icon}
      </span>
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: 14, fontWeight: selected ? 600 : 400,
          color: selected ? BRAND.navy : BRAND.navy,
          lineHeight: 1.4, display: 'block',
        }}>
          {option.label}
        </span>
        {option.detail && (
          <span style={{ fontSize: 12, color: BRAND.muted, marginTop: 3, display: 'block', lineHeight: 1.4 }}>
            {option.detail}
          </span>
        )}
      </div>
      <span style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: selected ? BRAND.gold : 'transparent',
        border: `2px solid ${selected ? BRAND.gold : BRAND.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
      }}>
        {selected && <span style={{ color: 'white', fontSize: 12, lineHeight: 1 }}>✓</span>}
      </span>
    </button>
  )
}

function CTAButton({ children, onClick, style, secondary }: {
  children: React.ReactNode; onClick?: () => void;
  style?: React.CSSProperties; secondary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '15px 20px', borderRadius: 12,
        background: secondary ? 'transparent' : BRAND.gold,
        color: secondary ? BRAND.muted : BRAND.navy,
        border: secondary ? `1px solid ${BRAND.border}` : 'none',
        cursor: 'pointer', fontSize: 15, fontWeight: secondary ? 400 : 700,
        letterSpacing: '0.01em', transition: 'all 0.2s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
function SplashScreen({ onStart }: { onStart: (p: Persona) => void }) {
  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease forwards' }}>
      {/* Badge */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: BRAND.goldLight, color: BRAND.gold, fontSize: 12,
          fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
          padding: '5px 14px', borderRadius: 99, marginBottom: 20,
          border: `1px solid ${BRAND.gold}40`,
        }}>
          ⏱️ 2 minutes · Résultat immédiat
        </span>

        {/* Samirra signature zone */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20,
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%',
            background: BRAND.navy, border: `3px solid ${BRAND.gold}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'Playfair Display', serif", color: BRAND.gold, fontSize: 22, fontWeight: 700 }}>S</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: BRAND.navy }}>
              Samirra Trari
            </div>
            <div style={{ fontSize: 12, color: BRAND.muted }}>
              Graphopédagogue · +5 500 enfants accompagnés
            </div>
          </div>
        </div>

        <h1 className="font-display" style={{
          fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 700,
          color: BRAND.navy, lineHeight: 1.25, marginBottom: 12,
        }}>
          La Méthode 15 Clés est-elle<br />
          <span style={{ color: BRAND.gold }}>faite pour vous ?</span>
        </h1>
        <p style={{ color: BRAND.muted, fontSize: 15, lineHeight: 1.65, maxWidth: 380, margin: '0 auto 24px' }}>
          Répondez à 4 questions.<br />
          Nous vous dirons si et comment nous pouvons vous aider — <strong style={{ color: BRAND.navy }}>gratuitement, sans engagement.</strong>
        </p>
      </div>

      {/* Social proof strip */}
      <div style={{
        background: BRAND.navy, borderRadius: 12, padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        marginBottom: 24, fontSize: 13, color: 'white',
      }}>
        ⭐⭐⭐⭐⭐
        <span style={{ fontWeight: 600 }}>+1 500 professionnels formés · +5 500 enfants accompagnés</span>
      </div>

      {/* Persona selector */}
      <p style={{ textAlign: 'center', fontSize: 13, color: BRAND.muted, marginBottom: 14, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Vous êtes…
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {[
          { p: 'parent' as Persona, icon: '👨‍👩‍👧', title: 'Parent', sub: 'Je veux aider mon enfant à mieux écrire' },
          { p: 'pro' as Persona, icon: '👩‍🏫', title: 'Professionnel de l’éducation ou de la santé', sub: 'Enseignant, orthophoniste, ergothérapeute, psychomotricien…' },
        ].map(({ p, icon, title, sub }) => (
          <button
            key={p}
            onClick={() => onStart(p)}
            style={{
              padding: '18px 20px', borderRadius: 16,
              border: `2px solid ${BRAND.border}`, background: BRAND.white,
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND.gold
              ;(e.currentTarget as HTMLButtonElement).style.background = BRAND.goldLight
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND.border
              ;(e.currentTarget as HTMLButtonElement).style.background = BRAND.white
            }}
          >
            <span style={{ fontSize: 30, flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.navy, marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 13, color: BRAND.muted, lineHeight: 1.4 }}>{sub}</div>
            </div>
            <span style={{ color: BRAND.gold, fontSize: 20 }}>→</span>
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
        🔒 Aucun spam · Réponses confidentielles · Résultat personnalisé
      </p>
    </div>
  )
}

// ─── NAME SCREEN ──────────────────────────────────────────────────────────────
function NameScreen({
  persona, onNext,
}: { persona: Persona; onNext: (prenom: string) => void }) {
  const [val, setVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div style={{ animation: 'fadeSlideIn 0.4s ease forwards' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>
          {persona === 'parent' ? '👋' : '👋'}
        </span>
        <h2 className="font-display" style={{
          fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: BRAND.navy, lineHeight: 1.3,
        }}>
          Avant de commencer,<br />quel est votre prénom ?
        </h2>
        <p style={{ fontSize: 14, color: BRAND.muted, marginTop: 8, lineHeight: 1.5 }}>
          Pour vous donner un résultat personnalisé.
        </p>
      </div>
      <input
        ref={inputRef}
        type="text" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && val.trim() && onNext(val.trim())}
        placeholder="Votre prénom…"
        style={{
          width: '100%', padding: '14px 16px', fontSize: 17,
          border: `2px solid ${val ? BRAND.gold : BRAND.border}`, borderRadius: 12,
          outline: 'none', background: BRAND.white, color: BRAND.navy,
          marginBottom: 14, fontFamily: 'inherit',
          transition: 'border-color 0.2s',
          boxShadow: val ? `0 0 0 3px ${BRAND.gold}18` : 'none',
        }}
      />
      <CTAButton onClick={() => val.trim() && onNext(val.trim())} style={{ opacity: val.trim() ? 1 : 0.45 }}>
        Continuer →
      </CTAButton>
    </div>
  )
}

// ─── CHILD NAME SCREEN ────────────────────────────────────────────────────────
function ChildNameScreen({
  prenom, onNext,
}: { prenom: string; onNext: (name: string) => void }) {
  const [val, setVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div style={{ animation: 'fadeSlideIn 0.4s ease forwards' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>✏️</span>
        <h2 className="font-display" style={{
          fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: BRAND.navy, lineHeight: 1.3,
        }}>
          Bonjour {prenom} 👋<br />
          Comment s’appelle votre enfant ?
        </h2>
        <p style={{ fontSize: 14, color: BRAND.muted, marginTop: 8 }}>
          Ça nous aide à personnaliser votre résultat.
        </p>
      </div>
      <input
        ref={inputRef}
        type="text" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onNext(val.trim() || 'votre enfant')}
        placeholder="Prénom de l’enfant…"
        style={{
          width: '100%', padding: '14px 16px', fontSize: 17,
          border: `2px solid ${val ? BRAND.gold : BRAND.border}`, borderRadius: 12,
          outline: 'none', background: BRAND.white, color: BRAND.navy,
          marginBottom: 14, fontFamily: 'inherit',
          transition: 'border-color 0.2s',
          boxShadow: val ? `0 0 0 3px ${BRAND.gold}18` : 'none',
        }}
      />
      <CTAButton onClick={() => onNext(val.trim() || 'votre enfant')}>
        Continuer →
      </CTAButton>
      <CTAButton secondary onClick={() => onNext('votre enfant')} style={{ marginTop: 8 }}>
        Passer cette question
      </CTAButton>
    </div>
  )
}

// ─── QUESTION VIEW ────────────────────────────────────────────────────────────
function QuestionView({
  question, questionIndex, totalQuestions, prenom, onAnswer, onBack,
}: {
  question: Question; questionIndex: number; totalQuestions: number;
  prenom: string; onAnswer: (optId: string, points: number, label: string) => void; onBack: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [exiting, setExiting] = useState(false)

  const handleSelect = (optId: string, points: number, label: string) => {
    if (selected) return
    setSelected(optId)
    setTimeout(() => {
      setExiting(true)
      setTimeout(() => onAnswer(optId, points, label), 250)
    }, 350)
  }

  return (
    <div style={{ animation: exiting ? 'fadeSlideOut 0.25s ease forwards' : 'fadeSlideIn 0.35s ease forwards' }}>
      <ProgressBar step={questionIndex + 1} total={totalQuestions} />

      {/* Back */}
      {questionIndex > 0 && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: BRAND.muted, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ← Précédent
        </button>
      )}

      <div style={{ marginBottom: 22 }}>
        <h2 style={{
          fontSize: 'clamp(17px,4vw,22px)', fontWeight: 700,
          color: BRAND.navy, lineHeight: 1.35, marginBottom: 6,
          fontFamily: "'Playfair Display', serif",
        }}>
          {question.text}
        </h2>
        {question.sub && (
          <p style={{ fontSize: 13, color: BRAND.muted, lineHeight: 1.5 }}>{question.sub}</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {question.options.map(opt => (
          <OptionBtn
            key={opt.id}
            option={opt}
            selected={selected === opt.id}
            onSelect={() => handleSelect(opt.id, opt.points, opt.label)}
            disabled={!!selected}
          />
        ))}
      </div>

      {question.socialProof && (
        <div style={{
          background: BRAND.navy + '0a', borderRadius: 10, padding: '10px 14px',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span style={{ fontSize: 12, color: BRAND.navy, lineHeight: 1.5, fontStyle: 'italic' }}>
            {question.socialProof}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── EMAIL CAPTURE ────────────────────────────────────────────────────────────
function EmailCapture({
  prenom, persona, score, onSubmit,
}: {
  prenom: string; persona: Persona; score: number; onSubmit: (email: string) => void
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const level = getLevel(score)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = () => {
    if (!email.includes('@')) return
    setLoading(true)
    setTimeout(() => onSubmit(email.trim()), 300)
  }

  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease forwards' }}>
      {/* Teaser */}
      <div style={{
        background: level === 'A' ? BRAND.goldLight : BRAND.navy + '0a',
        borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'center',
        border: `2px solid ${level === 'A' ? BRAND.gold : BRAND.border}`,
      }}>
        <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>
          {level === 'A' ? '🎯' : level === 'B' ? '💡' : '🌱'}
        </span>
        <p className="font-display" style={{
          fontWeight: 700, fontSize: 17, color: BRAND.navy, lineHeight: 1.35,
        }}>
          {prenom}, votre résultat est prêt !
        </p>
        <p style={{ fontSize: 13, color: BRAND.muted, marginTop: 6, lineHeight: 1.5 }}>
          {level === 'A'
            ? 'Vous correspondez exactement au profil que la Méthode aide le mieux.'
            : level === 'B'
            ? 'Vous êtes sur la bonne voie. Votre résultat contient des recommandations personnalisées.'
            : 'Votre résultat inclut des ressources gratuites adaptées à votre situation.'}
        </p>
      </div>

      <h3 style={{
        fontSize: 18, fontWeight: 700, color: BRAND.navy, marginBottom: 6, textAlign: 'center',
      }}>
        Où envoyer votre résultat ?
      </h3>
      <p style={{ textAlign: 'center', fontSize: 13, color: BRAND.muted, marginBottom: 18 }}>
        Entrez votre email pour accéder à votre analyse personnalisée.
      </p>

      <input
        ref={inputRef}
        type="email" value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="votre@email.com"
        style={{
          width: '100%', padding: '14px 16px', fontSize: 16,
          border: `2px solid ${email.includes('@') ? BRAND.gold : BRAND.border}`, borderRadius: 12,
          outline: 'none', background: BRAND.white, color: BRAND.navy,
          marginBottom: 14, fontFamily: 'inherit',
          transition: 'all 0.2s',
          boxShadow: email.includes('@') ? `0 0 0 3px ${BRAND.gold}18` : 'none',
        }}
      />

      <CTAButton onClick={handleSubmit} style={{ opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Chargement…' : `Voir mon résultat ${level === 'A' ? '→' : '→'}`}
      </CTAButton>

      <p style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#9CA3AF' }}>
        🔒 Zéro spam. Vous pouvez vous désinscrire en 1 clic.
      </p>
    </div>
  )
}

// ─── ANALYZING ────────────────────────────────────────────────────────────────
function AnalyzingScreen({ persona, prenom }: { persona: Persona; prenom: string }) {
  const steps = [
    `Analyse de vos réponses, ${prenom}…`,
    'Calcul de votre score de correspondance…',
    'Préparation de votre résultat personnalisé…',
  ]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900)
    const t2 = setTimeout(() => setStep(2), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '40px 0', animation: 'fadeSlideIn 0.4s ease forwards' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>
        {persona === 'parent' ? '👨‍👩‍👧' : '👩‍🏫'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, margin: '0 auto' }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: i <= step ? BRAND.goldLight : 'transparent',
            transition: 'all 0.4s', opacity: i <= step ? 1 : 0.25,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>
              {i < step ? '✅' : i === step ? '⏳' : '○'}
            </span>
            <span style={{ fontSize: 13, fontWeight: i <= step ? 600 : 400, color: i <= step ? BRAND.navy : BRAND.muted }}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── RESULTS SCREEN ───────────────────────────────────────────────────────────
function ResultsScreen({
  score, persona, prenom, enfant, pain, onRedirect,
}: {
  score: number; persona: Persona; prenom: string; enfant?: string; pain: string; onRedirect: () => void
}) {
  const maxScore = 100
  const pct = Math.min(100, Math.round((score / maxScore) * 100))
  const level = getLevel(score)
  const [countdown, setCountdown] = useState(12)

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); onRedirect(); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(t)
  }, [onRedirect])

  const content = {
    A: {
      emoji: '🎯',
      badge: 'Profil Prioritaire',
      badgeBg: BRAND.goldLight,
      badgeColor: BRAND.gold,
      title: persona === 'parent'
        ? `${prenom}, la Méthode 15 Clés peut changer la situation d'${enfant || 'votre enfant'}`
        : `${prenom}, la Méthode 15 Clés correspond exactement à votre pratique`,
      message: persona === 'parent'
        ? `Votre profil est parmi ceux qui obtiennent les meilleurs résultats avec la Méthode. Vous êtes disponible, motivé·e — ${enfant || 'votre enfant'} a besoin de ça maintenant.`
        : `Votre contexte, vos défis, votre timing : tout correspond. Vous pouvez appliquer la Méthode dès votre prochaine séance.`,
      cta: persona === 'parent' ? 'Découvrir la formation Parents →' : 'Découvrir la formation Professionnels →',
      social: persona === 'parent' ? '+5 500 enfants ont transformé leur écriture' : '+1 500 professionnels déjà formés en France',
    },
    B: {
      emoji: '💡',
      badge: 'Profil Intermédiaire',
      badgeBg: BRAND.navy + '0f',
      badgeColor: BRAND.navy,
      title: `${prenom}, vous êtes sur la bonne voie`,
      message: persona === 'parent'
        ? `Vous commencez à prendre le problème au sérieux. La Méthode peut vous aider, mais commencez d’abord par les ressources gratuites de Samirra.`
        : `Vous avez déjà de bonnes bases. La Méthode 15 Clés peut les compléter. Commencez par explorer le contenu gratuit disponible.`,
      cta: 'Voir les ressources gratuites →',
      social: '15 clés · 5h · À votre rythme',
    },
    C: {
      emoji: '🌱',
      badge: 'Profil Exploratoire',
      badgeBg: '#EFF6FF',
      badgeColor: BRAND.navyLight,
      title: `${prenom}, commencez par les bases`,
      message: 'La Méthode n’est peut-être pas la priorité du moment. Samirra partage du contenu gratuit pour les familles qui débutent — c’est le bon point de départ.',
      cta: 'Accéder aux ressources gratuites →',
      social: '',
    },
  }[level]

  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease forwards' }}>
      {/* Score card */}
      <div style={{
        background: content.badgeBg, borderRadius: 20, padding: '24px',
        marginBottom: 16, textAlign: 'center',
        border: `2px solid ${content.badgeColor}30`,
      }}>
        <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>{content.emoji}</span>

        {/* Badge */}
        <span style={{
          display: 'inline-block', background: content.badgeColor, color: 'white',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
          padding: '3px 12px', borderRadius: 99, marginBottom: 14,
        }}>
          {content.badge}
        </span>

        {/* Score ring */}
        <div style={{ margin: '0 auto 16px', width: 90, height: 90, position: 'relative' }}>
          <svg viewBox="0 0 90 90" style={{ width: 90, height: 90, transform: 'rotate(-90deg)' }}>
            <circle cx="45" cy="45" r="38" fill="none" stroke="#e5e7eb" strokeWidth="7" />
            <circle
              cx="45" cy="45" r="38" fill="none"
              stroke={content.badgeColor} strokeWidth="7"
              strokeDasharray={`${pct * 2.39} 239`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.2s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: content.badgeColor, lineHeight: 1 }}>{pct}</span>
            <span style={{ fontSize: 10, color: BRAND.muted }}>/100</span>
          </div>
        </div>

        <h2 className="font-display" style={{
          fontSize: 'clamp(17px,4vw,22px)', fontWeight: 700, color: BRAND.navy,
          lineHeight: 1.3, marginBottom: 10,
        }}>
          {content.title}
        </h2>
        <p style={{ fontSize: 13, color: BRAND.muted, lineHeight: 1.65, maxWidth: 340, margin: '0 auto' }}>
          {content.message}
        </p>

        {/* Pain recap */}
        {pain && (
          <div style={{
            marginTop: 16, background: BRAND.navy + '0a', borderRadius: 10,
            padding: '10px 14px', textAlign: 'left',
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span>🔍</span>
            <span style={{ fontSize: 12, color: BRAND.navy, lineHeight: 1.5 }}>
              <strong>Votre situation principale :</strong> {pain}
            </span>
          </div>
        )}
      </div>

      {/* Social proof */}
      {content.social && (
        <div style={{
          background: BRAND.navy, color: 'white', borderRadius: 12,
          padding: '10px 16px', display: 'flex', alignItems: 'center',
          gap: 8, marginBottom: 14, fontSize: 13,
        }}>
          <span>⭐</span>
          <span style={{ fontWeight: 500 }}>{content.social}</span>
        </div>
      )}

      {/* CTA */}
      <CTAButton onClick={onRedirect} style={{ marginBottom: 10, fontSize: 16 }}>
        {content.cta}
      </CTAButton>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF' }}>
        Redirection automatique dans {countdown}s…
      </p>
    </div>
  )
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  const handleLogin = () => {
    if (pwd === ADMIN_PASSWORD) {
      onLogin()
    } else {
      setError(true)
      setPwd('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BRAND.navy, padding: 20 }}>
      <Card style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: BRAND.navy, marginBottom: 6 }}>
          Espace Samirra
        </h2>
        <p style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20 }}>Tableau de bord — Leads SAS</p>
        <input
          type="password" value={pwd}
          onChange={e => { setPwd(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Mot de passe"
          style={{
            width: '100%', padding: '12px 14px', fontSize: 15,
            border: `2px solid ${error ? BRAND.red : BRAND.border}`, borderRadius: 10,
            outline: 'none', background: BRAND.cream, fontFamily: 'inherit',
            marginBottom: error ? 8 : 14,
          }}
        />
        {error && <p style={{ fontSize: 12, color: BRAND.red, marginBottom: 10 }}>Mot de passe incorrect.</p>}
        <CTAButton onClick={handleLogin}>Connexion</CTAButton>
      </Card>
    </div>
  )
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState<'all'|'A'|'B'|'C'>('all')
  const [persona, setPersona] = useState<'all'|'parent'|'pro'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const local = getLocalLeads()
    setLeads(local)
  }, [])

  const filtered = leads.filter(l => {
    if (filter !== 'all' && l.level !== filter) return false
    if (persona !== 'all' && l.persona !== persona) return false
    if (search && !l.prenom.toLowerCase().includes(search.toLowerCase()) && !l.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total: leads.length,
    A: leads.filter(l => l.level === 'A').length,
    B: leads.filter(l => l.level === 'B').length,
    C: leads.filter(l => l.level === 'C').length,
    parents: leads.filter(l => l.persona === 'parent').length,
    pros: leads.filter(l => l.persona === 'pro').length,
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Prénom', 'Email', 'Profil', 'Score', 'Niveau', 'Pain principal'],
      ...leads.map(l => [l.ts, l.prenom, l.email, l.persona || '', String(l.score), l.level, l.pain]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `sas-leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const levelColor = (l: string) => l === 'A' ? BRAND.gold : l === 'B' ? BRAND.navyLight : BRAND.muted
  const levelBg   = (l: string) => l === 'A' ? BRAND.goldLight : l === 'B' ? BRAND.navy + '0f' : '#f3f4f6'

  return (
    <div style={{ minHeight: '100vh', background: BRAND.cream, padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: BRAND.navy }}>
              Tableau de bord SAS
            </h1>
            <p style={{ fontSize: 13, color: BRAND.muted, marginTop: 2 }}>{stats.total} leads enregistrés</p>
          </div>
          <button onClick={exportCSV} style={{
            padding: '9px 18px', borderRadius: 10, background: BRAND.navy, color: 'white',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ⬇️ Exporter CSV
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total',     value: stats.total, color: BRAND.navy },
            { label: '🎯 Niveau A', value: stats.A,     color: BRAND.gold },
            { label: '💡 Niveau B', value: stats.B,     color: BRAND.navyLight },
            { label: '🌱 Niveau C', value: stats.C,     color: BRAND.muted },
            { label: '👨‍👩‍👧 Parents',  value: stats.parents, color: BRAND.navy },
            { label: '👩‍🏫 Pros',     value: stats.pros,    color: BRAND.navy },
          ].map(s => (
            <Card key={s.label} style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 3 }}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: 16, padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher…"
            style={{
              flex: 1, minWidth: 180, padding: '8px 12px', fontSize: 13,
              border: `1px solid ${BRAND.border}`, borderRadius: 8, outline: 'none', background: BRAND.cream,
            }}
          />
          {(['all','A','B','C'] as const).map(l => (
            <button key={l} onClick={() => setFilter(l)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === l ? BRAND.navy : BRAND.cream,
              color: filter === l ? 'white' : BRAND.muted,
              border: `1px solid ${filter === l ? BRAND.navy : BRAND.border}`,
            }}>
              {l === 'all' ? 'Tous' : `Niveau ${l}`}
            </button>
          ))}
          {(['all','parent','pro'] as const).map(p => (
            <button key={p} onClick={() => setPersona(p)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: persona === p ? BRAND.gold : BRAND.cream,
              color: persona === p ? BRAND.navy : BRAND.muted,
              border: `1px solid ${persona === p ? BRAND.gold : BRAND.border}`,
            }}>
              {p === 'all' ? 'Tous profils' : p === 'parent' ? '👨‍👩‍👧 Parents' : '👩‍🏫 Pros'}
            </button>
          ))}
        </Card>

        {/* Leads list */}
        {filtered.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: BRAND.muted, fontSize: 14 }}>
              {leads.length === 0 ? 'Aucun lead enregistré pour le moment.' : 'Aucun résultat pour ces filtres.'}
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(l => (
              <Card key={l.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Level badge */}
                  <span style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
                    background: levelBg(l.level), color: levelColor(l.level),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, border: `2px solid ${levelColor(l.level)}30`,
                  }}>
                    {l.level}
                  </span>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: BRAND.navy }}>
                      {l.prenom}
                      {l.enfant && <span style={{ fontWeight: 400, color: BRAND.muted }}> · enfant : {l.enfant}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: BRAND.muted, marginTop: 2 }}>{l.email}</div>
                    {l.pain && (
                      <div style={{ fontSize: 12, color: BRAND.navy, marginTop: 5, background: BRAND.navy + '0a', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                        🎯 {l.pain}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: BRAND.gold, background: BRAND.goldLight,
                      padding: '3px 8px', borderRadius: 6, display: 'block', marginBottom: 4,
                    }}>
                      {l.persona === 'parent' ? '👨‍👩‍👧 Parent' : '👩‍🏫 Pro'}
                    </span>
                    <span style={{ fontSize: 11, color: BRAND.muted }}>Score : {l.score}/100</span><br/>
                    <span style={{ fontSize: 11, color: BRAND.muted }}>{l.ts}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  // Admin check
  const isAdminRoute = window.location.pathname.includes('/admin')
  const [adminAuth, setAdminAuth] = useState(() => sessionStorage.getItem('sas_admin') === '1')

  if (isAdminRoute) {
    if (!adminAuth) return <AdminLogin onLogin={() => { sessionStorage.setItem('sas_admin','1'); setAdminAuth(true) }} />
    return <AdminDashboard />
  }

  const [step, setStep] = useState<Step>('splash')
  const [persona, setPersona] = useState<Persona>(null)
  const [prenom, setPrenom] = useState('')
  const [enfant, setEnfant] = useState('')
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [email, setEmail] = useState('')

  const questions = persona === 'parent'
    ? Q_PARENT(prenom, enfant)
    : Q_PRO(prenom)

  const handleStart = (p: Persona) => {
    setPersona(p)
    setStep('name')
  }

  const handleName = (name: string) => {
    setPrenom(name)
    setStep(persona === 'parent' ? 'child_name' : 'questions')
    setCurrentQ(0)
    setAnswers([])
  }

  const handleChildName = (name: string) => {
    setEnfant(name)
    setStep('questions')
    setCurrentQ(0)
    setAnswers([])
  }

  const handleAnswer = (optId: string, points: number, label: string) => {
    const newAnswers = [...answers, { qId: questions[currentQ].id, optId, points, label }]
    setAnswers(newAnswers)
    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1)
    } else {
      const totalScore = newAnswers.reduce((s, a) => s + a.points, 0)
      setScore(totalScore)
      setStep('email_capture')
    }
  }

  const handleBack = () => {
    if (currentQ === 0) {
      setStep(persona === 'parent' ? 'child_name' : 'name')
      return
    }
    const newAnswers = answers.slice(0, -1)
    setAnswers(newAnswers)
    setCurrentQ(currentQ - 1)
  }

  const handleEmailSubmit = async (emailVal: string) => {
    setEmail(emailVal)
    const level = getLevel(score)
    const pain = getPain(answers, persona)

    const lead: Lead = {
      id: Date.now().toString(),
      ts: new Date().toLocaleString('fr-FR'),
      prenom,
      enfant: persona === 'parent' ? enfant : undefined,
      email: emailVal,
      persona,
      score,
      level,
      answers,
      pain,
    }

    saveLeadLocally(lead)
    sendToVPS(lead)

    setStep('analyzing')
    setTimeout(() => setStep('results'), 2600)
  }

  const handleRedirect = () => {
    const level = getLevel(score)
    let url = persona === 'parent' ? REDIRECT.parentKO : REDIRECT.proKO
    if (level === 'A') url = persona === 'parent' ? REDIRECT.parentOK : REDIRECT.proOK
    window.location.href = url
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BRAND.cream }}>
      {/* Header */}
      <header style={{
        padding: '14px 20px', background: BRAND.white,
        borderBottom: `1px solid ${BRAND.border}`,
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 8px rgba(26,39,68,0.06)',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Logo />
        </div>
      </header>

      {/* Main */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '28px 20px 60px',
      }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          {step === 'splash'        && <SplashScreen onStart={handleStart} />}
          {step === 'name'          && <NameScreen persona={persona} onNext={handleName} />}
          {step === 'child_name'    && <ChildNameScreen prenom={prenom} onNext={handleChildName} />}
          {step === 'questions'     && persona && (
            <QuestionView
              key={`${persona}-${currentQ}`}
              question={questions[currentQ]}
              questionIndex={currentQ}
              totalQuestions={questions.length}
              prenom={prenom}
              onAnswer={handleAnswer}
              onBack={handleBack}
            />
          )}
          {step === 'email_capture' && (
            <EmailCapture prenom={prenom} persona={persona} score={score} onSubmit={handleEmailSubmit} />
          )}
          {step === 'analyzing'     && <AnalyzingScreen persona={persona} prenom={prenom} />}
          {step === 'results'       && (
            <ResultsScreen
              score={score} persona={persona}
              prenom={prenom} enfant={enfant}
              pain={getPain(answers, persona)}
              onRedirect={handleRedirect}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '14px 20px', textAlign: 'center',
        borderTop: `1px solid ${BRAND.border}`, background: BRAND.white,
      }}>
        <p style={{ fontSize: 11, color: '#9CA3AF' }}>
          © 2026 Samirra Trari · Méthode 15 Clés · Données confidentielles
          {' · '}
          <a href="/admin" style={{ color: '#d1d5db', textDecoration: 'none' }}>Espace pro</a>
        </p>
      </footer>
    </div>
  )
}
