import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ArrowRight, X, Edit2, Trash2, Filter, Search, Download, AlertCircle, Activity, Phone, Mail, Linkedin, Globe, Instagram, FileText, Sparkles, Archive, ArchiveRestore, MessageSquare as MessageBubble } from 'lucide-react';
import { storage } from './lib/storage.js';

// ============================================================================
// AEPC COMMAND CENTER
// Internal operating dashboard for the Arbor Executive Partner Channel
// ============================================================================

const OWNERS = ['Ryan', 'Dave', 'Taylor', 'Jessica'];
const STAGES = ['Cold', 'Touched', 'Engaged', 'Meeting Booked', 'Activated Partner'];
const STAGE_COLORS = {
  'Cold': 'bg-stone-800 text-stone-300 border-stone-700',
  'Touched': 'bg-amber-950 text-amber-200 border-amber-900',
  'Engaged': 'bg-blue-950 text-blue-200 border-blue-900',
  'Meeting Booked': 'bg-emerald-950 text-emerald-200 border-emerald-900',
  'Activated Partner': 'bg-arbor-green/20 text-arbor-green border-arbor-green/40',
};
const TYPES = ['Financial Advisor', 'CPA', 'Realtor', 'Attorney', 'Past Client', 'Other'];
const TYPE_COLORS = {
  'Financial Advisor': 'text-cyan-400',
  'CPA': 'text-violet-400',
  'Realtor': 'text-rose-400',
  'Attorney': 'text-fuchsia-400',
  'Past Client': 'text-amber-400',
  'Other': 'text-stone-400',
};

// The three ecosystem roles we capture from each past client. Order matters
// for display: this is the call script order ("update your CPA, FA, attorney").
const ECOSYSTEM_ROLES = [
  { type: 'CPA', label: 'CPA' },
  { type: 'Financial Advisor', label: 'Financial Advisor' },
  { type: 'Attorney', label: 'Trust / Estate Attorney' },
];
const TOUCH_TYPES = ['Call', 'Email', 'Text', 'LinkedIn DM', 'Social Engage', 'Zoom', 'In-Person', 'Event'];

// Social touches feed the Social Outreach incubator's "last touched" column.
// LinkedIn DM = heavy outbound; Social Engage = lighter (comment, reaction, connection req, IG, etc.)
const SOCIAL_TOUCH_TYPES = new Set(['LinkedIn DM', 'Social Engage']);

// ----------------------------------------------------------------------------
// Storage layer is imported from ./lib/storage.js — uses Vercel KV API.
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Seed data — gives Ryan something real to look at on first load
// ----------------------------------------------------------------------------
const SEED_PROSPECTS = [
  { id: 'p1', name: 'Sari Ward', firm: 'Compass Laguna Niguel', type: 'Realtor', stage: 'Engaged', owner: 'Ryan', city: 'Laguna Niguel, CA', notes: 'CODE blueprint pitch in flight. Owns top-of-market beach inventory.', lastTouch: '2026-04-22', nextAction: 'Send AEPC Partner Preview link', nextActionDate: '2026-05-08', eiosId: '', eiosSynced: false },
  { id: 'p2', name: 'Michele Town', firm: 'Town Group', type: 'Realtor', stage: 'Activated Partner', owner: 'Ryan', city: 'Orange County, CA', notes: 'Builder account specialist. ~$300M annual production. Onboarding in flight.', lastTouch: '2026-05-01', nextAction: 'Confirm Arive + Loan Sifter access', nextActionDate: '2026-05-06', eiosId: '', eiosSynced: false },
  { id: 'p3', name: 'Mark Henderson', firm: 'Henderson Wealth Advisors', type: 'Financial Advisor', stage: 'Cold', owner: 'Jessica', city: 'Newport Beach, CA', notes: 'Top RIA in NB. LinkedIn warming sequence to start.', lastTouch: '', nextAction: 'Connection request + comment on recent post', nextActionDate: '2026-05-06', eiosId: '', eiosSynced: false },
  { id: 'p4', name: 'Linda Park, CPA', firm: 'Park & Associates', type: 'CPA', stage: 'Touched', owner: 'Jessica', city: 'Irvine, CA', notes: 'Self-employed clientele heavy. Met at Arbor Invitational.', lastTouch: '2026-04-18', nextAction: 'Follow-up DM with Bank Statement Loan one-pager', nextActionDate: '2026-05-07', eiosId: '', eiosSynced: false },
  { id: 'p5', name: 'Tom Reyes', firm: 'Past Client — refi 2022', type: 'Past Client', stage: 'Cold', owner: 'Ryan', city: 'Mission Viejo, CA', notes: 'Closed $1.2M refi 2022. Owns CPA practice. Strong referral candidate.', lastTouch: '', nextAction: 'Personal call: ask for FA/CPA introduction', nextActionDate: '2026-05-09', eiosId: '', eiosSynced: false, closedAt: '2026-04-01' },
  { id: 'p6', name: 'David Chen', firm: 'Chen Financial Planning', type: 'Financial Advisor', stage: 'Meeting Booked', owner: 'Dave', city: 'Costa Mesa, CA', notes: 'Zoom scheduled. Complex K-1 client referred via Margaret intro.', lastTouch: '2026-05-02', nextAction: 'Run prep — review borrower scenario before Zoom', nextActionDate: '2026-05-12', eiosId: '', eiosSynced: false },
];

const SEED_ACTIVITIES = [
  { id: 'a1', prospectId: 'p2', date: '2026-05-01', type: 'Zoom', owner: 'Ryan', outcome: 'Confirmed onboarding sequence. Investor credentials issue flagged.', next: 'Confirm Arive + Loan Sifter access by 5/6' },
  { id: 'a2', prospectId: 'p1', date: '2026-04-22', type: 'In-Person', owner: 'Ryan', outcome: 'Coffee meeting. Strong interest in CODE blueprint approach.', next: 'Send AEPC Partner Preview link' },
  { id: 'a3', prospectId: 'p4', date: '2026-04-18', type: 'In-Person', owner: 'Jessica', outcome: 'Met at Arbor Invitational. Exchanged cards, established rapport.', next: 'LinkedIn connect + Bank Statement one-pager DM' },
  { id: 'a4', prospectId: 'p6', date: '2026-05-02', type: 'Email', owner: 'Margaret', outcome: 'Warm handoff intro from existing partner. Zoom scheduled 5/12.', next: 'Dave to prep scenario walkthrough' },
];

// Lead = a borrower referred by a prospect. Tracks pipeline value.
const LEAD_STATUSES = ['Open', 'Funded', 'Lost'];
const LEAD_STATUS_COLORS = {
  'Open': 'bg-blue-950 text-blue-200 border-blue-900',
  'Funded': 'bg-arbor-green/20 text-arbor-green border-arbor-green/40',
  'Lost': 'bg-stone-900 text-stone-500 border-stone-800',
};
const SEED_LEADS = [
  { id: 'l1', prospectId: 'p2', name: 'Reinhardt build-to-suit', status: 'Funded', loanAmount: 1850000, revenue: 27750, fundedDate: '2026-04-08', notes: 'Builder-account first-of-many. Smooth close.', createdAt: '2026-02-14' },
  { id: 'l2', prospectId: 'p2', name: 'Aoki primary refinance', status: 'Open', loanAmount: 950000, revenue: 0, fundedDate: '', notes: 'In underwriting. ETA 5/22.', createdAt: '2026-04-30' },
  { id: 'l3', prospectId: 'p1', name: 'Fenton coastal purchase', status: 'Open', loanAmount: 2400000, revenue: 0, fundedDate: '', notes: 'Sari\'s buyer. CODE blueprint demo on 5/14.', createdAt: '2026-05-02' },
];

// Past-client cadence = the rhythm Margaret + Taylor work the previous-90-day book.
// 30d / 90d are Margaret's relationship check-ins; 45d is Taylor's referral ask.
// `outcomeMatch` = fragment we look for in activity outcomes to mark a touchpoint
// done. The Log button on a cadence row pre-fills the activity outcome with the
// `prefillOutcome` so the round-trip detection is reliable.
const PAST_CLIENT_CADENCE = [
  { id: '30d', label: '30-day check-in', days: 30, owner: 'Margaret', outcomeMatch: '30-day post-close', prefillOutcome: '30-day post-close check-in: ', graceDays: 7 },
  { id: '45d', label: '45-day partner ask', days: 45, owner: 'Taylor', outcomeMatch: '45-day partner ask', prefillOutcome: '45-day partner-source ask: ', graceDays: 7 },
  { id: '90d', label: '90-day check-in', days: 90, owner: 'Margaret', outcomeMatch: '90-day post-close', prefillOutcome: '90-day post-close check-in: ', graceDays: 14 },
];

// Event = open house, networking, workshop. Auto-creates a touch on each linked prospect.
const EVENT_TYPES = ['Open House Hosted', 'Open House Attended', 'Networking', 'Workshop', 'Conference', 'Other'];
const SEED_EVENTS = [
  { id: 'ev1', type: 'Open House Hosted', date: '2026-04-26', location: 'Laguna Niguel · 23 Beach Dr', host: 'Taylor', prospectIds: ['p1'], notes: 'Co-hosted with Sari. ~40 visitors, 6 collected business cards.', createdAt: '2026-04-25' },
  { id: 'ev2', type: 'Open House Attended', date: '2026-05-03', location: 'Newport Beach · 1855 Bayside Cv', host: 'Margaret', prospectIds: [], notes: 'Scoping. Listing agent Lisa Chen — add as prospect after follow-up.', createdAt: '2026-05-03' },
];

// ----------------------------------------------------------------------------
// Main App
// ----------------------------------------------------------------------------
export default function CommandCenter() {
  const [view, setView] = useState('overview');
  const [prospects, setProspects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [events, setEvents] = useState([]);
  const [monthlyGoal, setMonthlyGoal] = useState(12);
  const [eiosConfig, setEiosConfig] = useState({ baseUrl: '', webhookUrl: '', enabled: false });
  const [loaded, setLoaded] = useState(false);
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);
  const [showActivityForm, setShowActivityForm] = useState(null); // prospect id or null
  const [detailProspectId, setDetailProspectId] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(null); // { prospectId, lead? }
  const [showEventForm, setShowEventForm] = useState(null); // event or {} for new
  const [filterOwner, setFilterOwner] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [prospectsMode, setProspectsMode] = useState('list'); // 'list' | 'board'
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, kind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Load on mount
  useEffect(() => {
    (async () => {
      const p = await storage.get('aepc:prospects');
      const a = await storage.get('aepc:activities');
      const l = await storage.get('aepc:leads');
      const ev = await storage.get('aepc:events');
      const g = await storage.get('aepc:monthlyGoal');
      const c = await storage.get('aepc:eiosConfig');
      setProspects(p && p.length ? p : SEED_PROSPECTS);
      setActivities(a && a.length ? a : SEED_ACTIVITIES);
      setLeads(l && l.length ? l : SEED_LEADS);
      setEvents(ev && ev.length ? ev : SEED_EVENTS);
      setMonthlyGoal(g || 12);
      if (c) setEiosConfig(c);
      setLoaded(true);
    })();
  }, []);

  // Persist
  useEffect(() => { if (loaded) storage.set('aepc:prospects', prospects); }, [prospects, loaded]);
  useEffect(() => { if (loaded) storage.set('aepc:activities', activities); }, [activities, loaded]);
  useEffect(() => { if (loaded) storage.set('aepc:leads', leads); }, [leads, loaded]);
  useEffect(() => { if (loaded) storage.set('aepc:events', events); }, [events, loaded]);
  useEffect(() => { if (loaded) storage.set('aepc:monthlyGoal', monthlyGoal); }, [monthlyGoal, loaded]);
  useEffect(() => { if (loaded) storage.set('aepc:eiosConfig', eiosConfig); }, [eiosConfig, loaded]);

  // Webhook fire — best-effort, never blocks the UI
  const fireWebhook = async (event, payload) => {
    if (!eiosConfig.enabled || !eiosConfig.webhookUrl) return;
    try {
      await fetch(eiosConfig.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, source: 'aepc-command-center', timestamp: new Date().toISOString(), ...payload })
      });
    } catch (e) { /* silent */ }
  };

  // ------------------------------------------------------------
  // Derived metrics
  // ------------------------------------------------------------
  // useMemo so `now` is stable across renders (avoids invalidating downstream memos).
  const now = useMemo(() => new Date(), []);
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Active = not archived. Used for every pipeline view except the Targets list
  // (which has a Show Archived toggle) and the Activity log (historical, name lookups).
  const activeProspects = useMemo(() => prospects.filter(p => !p.archived), [prospects]);

  const lastMonth = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [now]);

  const meetingsThisMonth = useMemo(() =>
    activities.filter(a =>
      (a.type === 'Zoom' || a.type === 'In-Person') &&
      a.date && a.date.startsWith(thisMonth)
    ).length
  , [activities, thisMonth]);

  // Lead + funding metrics for the team scoreboard.
  const leadStats = useMemo(() => {
    const cur = { count: 0, funded: 0, volume: 0, revenue: 0 };
    const prev = { count: 0, funded: 0, volume: 0, revenue: 0 };
    leads.forEach(l => {
      const created = (l.createdAt || '').slice(0, 7);
      const funded = (l.fundedDate || '').slice(0, 7);
      if (created === thisMonth) cur.count += 1;
      if (created === lastMonth) prev.count += 1;
      if (l.status === 'Funded' && funded === thisMonth) {
        cur.funded += 1;
        cur.volume += Number(l.loanAmount) || 0;
        cur.revenue += Number(l.revenue) || 0;
      }
      if (l.status === 'Funded' && funded === lastMonth) {
        prev.funded += 1;
        prev.volume += Number(l.loanAmount) || 0;
        prev.revenue += Number(l.revenue) || 0;
      }
    });
    return { cur, prev };
  }, [leads, thisMonth, lastMonth]);

  // Last 6 calendar months (oldest → newest) of meeting counts.
  const monthlyTrend = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = activities.filter(a =>
        (a.type === 'Zoom' || a.type === 'In-Person') &&
        a.date && a.date.startsWith(key)
      ).length;
      out.push({ key, count, label: d.toLocaleString('en', { month: 'short' }) });
    }
    return out;
  }, [activities, now]);

  const monthDelta = useMemo(() => {
    if (monthlyTrend.length < 2) return null;
    const cur = monthlyTrend[monthlyTrend.length - 1].count;
    const prev = monthlyTrend[monthlyTrend.length - 2].count;
    return cur - prev;
  }, [monthlyTrend]);

  const stageCounts = useMemo(() => {
    const c = {};
    STAGES.forEach(s => c[s] = 0);
    activeProspects.forEach(p => { if (c[p.stage] !== undefined) c[p.stage]++; });
    return c;
  }, [activeProspects]);

  const [showArchived, setShowArchived] = useState(false);
  const filtered = useMemo(() => prospects.filter(p => {
    if (!showArchived && p.archived) return false;
    if (filterOwner !== 'All' && p.owner !== filterOwner) return false;
    if (filterType !== 'All' && p.type !== filterType) return false;
    if (searchTerm && !`${p.name} ${p.firm} ${p.city || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }), [prospects, filterOwner, filterType, searchTerm, showArchived]);
  const archivedCount = useMemo(() => prospects.filter(p => p.archived).length, [prospects]);

  // ------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------
  const saveProspect = (data) => {
    const withSync = { ...data, eiosSynced: eiosConfig.enabled ? false : data.eiosSynced };
    if (data.id) {
      setProspects(prev => prev.map(p => p.id === data.id ? withSync : p));
      fireWebhook('prospect.updated', { prospect: withSync });
      pushToast(`Saved ${withSync.name}`, 'success');
    } else {
      const newProspect = { ...withSync, id: `p${Date.now()}` };
      setProspects(prev => [...prev, newProspect]);
      fireWebhook('prospect.created', { prospect: newProspect });
      pushToast(`Added ${newProspect.name} to ${newProspect.owner}'s list`, 'success');
    }
    setShowProspectForm(false);
    setEditingProspect(null);
  };

  const [confirmState, setConfirmState] = useState(null); // { title, body, onConfirm }

  const deleteProspect = (id) => {
    const target = prospects.find(p => p.id === id);
    if (!target) return;
    setConfirmState({
      title: `Delete ${target.name}?`,
      body: `This removes the prospect and all logged touches (${activities.filter(a => a.prospectId === id).length}). This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        setProspects(prev => prev.filter(p => p.id !== id));
        setActivities(prev => prev.filter(a => a.prospectId !== id));
        fireWebhook('prospect.deleted', { prospect: target });
        pushToast(`Deleted ${target.name}`, 'info');
        if (detailProspectId === id) setDetailProspectId(null);
        setConfirmState(null);
      },
    });
  };

  const logActivity = (data) => {
    const newActivity = { ...data, id: `a${Date.now()}` };
    setActivities(prev => [newActivity, ...prev]);
    const target = prospects.find(p => p.id === data.prospectId);
    let advanced = null;
    setProspects(prev => prev.map(p => {
      if (p.id !== data.prospectId) return p;
      const updates = { ...p, lastTouch: data.date };
      if (data.next) updates.nextAction = data.next;
      if ((data.type === 'Zoom' || data.type === 'In-Person') && p.stage !== 'Activated Partner') {
        if (p.stage !== 'Meeting Booked') advanced = 'Meeting Booked';
        updates.stage = 'Meeting Booked';
      } else if (data.type !== 'Event' && p.stage === 'Cold') {
        advanced = 'Touched';
        updates.stage = 'Touched';
      }
      return updates;
    }));
    fireWebhook('activity.logged', { activity: newActivity, prospect: target });
    setShowActivityForm(null);
    if (advanced) pushToast(`${target?.name || 'Prospect'} → ${advanced}`, 'success');
    else pushToast(`Logged ${data.type} on ${target?.name || 'prospect'}`, 'success');
  };

  const advanceStage = (id, newStage) => {
    const target = prospects.find(p => p.id === id);
    if (!target || target.stage === newStage) return;
    const updated = { ...target, stage: newStage };
    setProspects(prev => prev.map(p => p.id === id ? updated : p));
    fireWebhook('prospect.updated', { prospect: updated });
    pushToast(`${target.name} → ${newStage}`, 'success');
  };

  // Drop a queued next-action without logging a touch. Use case: action is no
  // longer relevant (e.g. they canceled the meeting, you decided to deprioritize).
  const dismissNextAction = (id) => {
    const target = prospects.find(p => p.id === id);
    if (!target) return;
    const updated = { ...target, nextAction: '', nextActionDate: '' };
    setProspects(prev => prev.map(p => p.id === id ? updated : p));
    fireWebhook('prospect.updated', { prospect: updated });
    pushToast(`Cleared next action for ${target.name}`, 'info');
  };

  // ------------------------------------------------------------
  // Leads — borrowers referred by a prospect; the value side of the relationship
  // ------------------------------------------------------------
  const saveLead = (data) => {
    const target = prospects.find(p => p.id === data.prospectId);
    if (data.id) {
      setLeads(prev => prev.map(l => l.id === data.id ? data : l));
      fireWebhook('lead.updated', { lead: data, prospect: target });
      if (data.status === 'Funded') pushToast(`Lead funded: ${data.name} (${formatCurrency(data.revenue)} revenue)`, 'success');
      else pushToast(`Updated lead ${data.name}`, 'success');
    } else {
      const newLead = { ...data, id: `l${Date.now()}`, createdAt: new Date().toISOString() };
      setLeads(prev => [newLead, ...prev]);
      fireWebhook('lead.created', { lead: newLead, prospect: target });
      pushToast(`Logged lead from ${target?.name || 'prospect'}`, 'success');
    }
    setShowLeadForm(null);
  };

  const deleteLead = (id) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    setConfirmState({
      title: `Delete lead "${lead.name}"?`,
      body: 'Removes only this lead. Touches and prospect record stay intact.',
      confirmLabel: 'Delete Lead',
      destructive: true,
      onConfirm: () => {
        setLeads(prev => prev.filter(l => l.id !== id));
        fireWebhook('lead.deleted', { lead });
        pushToast(`Deleted lead ${lead.name}`, 'info');
        setConfirmState(null);
      },
    });
  };

  // ------------------------------------------------------------
  // Events — open houses, networking; auto-create a touch on each linked prospect
  // ------------------------------------------------------------
  const saveEvent = (data) => {
    const isNew = !data.id;
    const ev = isNew
      ? { ...data, id: `ev${Date.now()}`, createdAt: new Date().toISOString() }
      : data;

    if (isNew) {
      setEvents(prev => [ev, ...prev]);
    } else {
      setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
    }

    // Mirror as activities for each linked prospect (only on create — editing
    // an event doesn't recreate or modify the auto-created activities, so the
    // operator can edit them independently).
    if (isNew && ev.prospectIds?.length) {
      const newActivities = ev.prospectIds.map(pid => ({
        id: `a${Date.now()}-${pid}`,
        prospectId: pid,
        date: ev.date,
        type: 'Event',
        owner: ev.host,
        outcome: `${ev.type}${ev.location ? ` at ${ev.location}` : ''}${ev.notes ? ` — ${ev.notes}` : ''}`,
        next: '',
        eventId: ev.id,
      }));
      setActivities(prev => [...newActivities, ...prev]);
      // Update each prospect's lastTouch
      setProspects(prev => prev.map(p => ev.prospectIds.includes(p.id) && (!p.lastTouch || p.lastTouch < ev.date)
        ? { ...p, lastTouch: ev.date }
        : p
      ));
    }

    fireWebhook(isNew ? 'event.created' : 'event.updated', { event: ev });
    pushToast(isNew
      ? `Logged ${ev.type}${ev.prospectIds?.length ? ` (touched ${ev.prospectIds.length})` : ''}`
      : `Updated ${ev.type}`,
      'success');
    setShowEventForm(null);
  };

  const deleteEvent = (id) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    setConfirmState({
      title: `Delete event "${ev.type} · ${ev.date}"?`,
      body: 'Removes the event. Activities auto-created from it stay (delete them separately if needed).',
      confirmLabel: 'Delete Event',
      destructive: true,
      onConfirm: () => {
        setEvents(prev => prev.filter(e => e.id !== id));
        fireWebhook('event.deleted', { event: ev });
        pushToast(`Deleted event`, 'info');
        setConfirmState(null);
      },
    });
  };

  // Fire-and-forget webhook for the future CODE scraper. Records a timestamp
  // on the prospect so the UI can show "requested" state until the scraper
  // service writes a `codeUrl` back via /api/data.
  const requestCodeDossier = (id) => {
    const target = prospects.find(p => p.id === id);
    if (!target) return;
    const updated = { ...target, codeRequestedAt: new Date().toISOString() };
    setProspects(prev => prev.map(p => p.id === id ? updated : p));
    fireWebhook('prospect.codeRequested', { prospect: updated });
    pushToast(`CODE dossier requested for ${target.name}`, 'success');
  };

  // ------------------------------------------------------------
  // Ecosystem capture — turn a past client's mention of their CPA / FA /
  // Attorney into a fresh prospect record with a warm-intro context.
  // ------------------------------------------------------------
  const captureEcosystemProspect = (pastClient, role, contact) => {
    const newProspect = {
      id: `p${Date.now()}`,
      name: contact.name,
      firm: contact.firm || '',
      type: role,
      stage: 'Cold',
      owner: pastClient.owner || 'Ryan',
      city: contact.city || '',
      notes: contact.notes
        ? `${contact.notes}\n\nReferred via past client: ${pastClient.name} (${pastClient.firm || ''})`
        : `Referred via past client: ${pastClient.name} (${pastClient.firm || ''})`,
      lastTouch: '',
      nextAction: `Warm intro outreach — reference ${pastClient.name}`,
      nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      eiosId: '',
      eiosSynced: false,
      phone: contact.phone || '',
      email: contact.email || '',
      linkedinUrl: contact.linkedinUrl || '',
      websiteUrl: '',
      instagramUrl: '',
      retrUrl: '',
      codeUrl: '',
      codeRequestedAt: '',
      archived: false,
      archivedAt: '',
      referredByPastClientId: pastClient.id,
    };
    setProspects(prev => [...prev, newProspect]);
    // Mark past client as having been asked / produced ecosystem
    if (!pastClient.ecosystemAskedAt) {
      const updated = { ...pastClient, ecosystemAskedAt: new Date().toISOString() };
      setProspects(prev => prev.map(p => p.id === pastClient.id ? updated : p));
    }
    fireWebhook('prospect.created', { prospect: newProspect, ecosystemSource: { pastClientId: pastClient.id, pastClientName: pastClient.name, role } });
    pushToast(`Captured ${role.toLowerCase()} ${newProspect.name} — referred by ${pastClient.name}`, 'success');
  };

  // Fire-and-forget request: the EiOS-side worker should pull all contacts
  // tagged "Past Client" of Ryan/Dave/Taylor and write them back to
  // /api/data on key aepc:prospects.
  const pullPastClientsFromEios = () => {
    fireWebhook('pastclients.pullRequested', {
      ownerScope: ['Ryan', 'Dave', 'Taylor'],
      requestedAt: new Date().toISOString(),
    });
    pushToast('Pull requested. EiOS sync may take a moment to push past clients into this dashboard.', 'info');
  };

  // Archive = soft-delete. The record stays in the dataset (and in EiOS via
  // webhook) but is filtered out of every active pipeline view. Used when a
  // prospect goes dormant — keep the history, get them off the daily board.
  const setArchived = (id, archived) => {
    const target = prospects.find(p => p.id === id);
    if (!target) return;
    const updated = {
      ...target,
      archived,
      archivedAt: archived ? new Date().toISOString() : ''
    };
    setProspects(prev => prev.map(p => p.id === id ? updated : p));
    fireWebhook(archived ? 'prospect.archived' : 'prospect.unarchived', { prospect: updated });
    pushToast(archived ? `Archived ${target.name}` : `Restored ${target.name}`, 'info');
  };

  // Keyboard shortcuts: Cmd/Ctrl+K → quick add; / → focus search; Esc → close any open modal/drawer; n → new prospect.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const inField = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setEditingProspect(null);
        setShowProspectForm(true);
        return;
      }

      if (e.key === 'Escape') {
        if (showProspectForm) { setShowProspectForm(false); setEditingProspect(null); }
        else if (showActivityForm) setShowActivityForm(null);
        else if (detailProspectId) setDetailProspectId(null);
        else if (confirmState) setConfirmState(null);
        return;
      }

      if (inField) return;

      if (e.key === '/') {
        e.preventDefault();
        setView('pipeline');
        setProspectsMode('list');
        // focus is handled by autoFocus prop on the search input next render via querySelector
        setTimeout(() => {
          const el = document.querySelector('input[data-search="prospects"]');
          if (el) el.focus();
        }, 0);
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        setEditingProspect(null);
        setShowProspectForm(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProspectForm, showActivityForm, detailProspectId, confirmState]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-400 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.4em] text-arbor-green uppercase mb-3 animate-pulse">Arbor · Internal</div>
          <div className="font-display text-3xl text-stone-200 mb-6">The AEPC Command Center</div>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 bg-arbor-green rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <div className="font-mono text-[10px] tracking-widest text-stone-600 uppercase mt-4">Loading the desk</div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* HEADER */}
      <header className="border-b border-stone-800 bg-stone-950/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 pb-0 lg:py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start justify-between lg:block gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="font-mono text-[10px] tracking-[0.3em] text-arbor-green uppercase">Arbor · Internal</span>
                <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 border ${eiosConfig.enabled ? 'text-arbor-green border-arbor-green/40 bg-arbor-green/5' : 'text-stone-500 border-stone-700'}`}>
                  {eiosConfig.enabled ? '◉ EiOS Sync Live' : '○ EiOS Sync Off'}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-medium text-stone-100 leading-none mt-1">
                The AEPC Command Center
              </h1>
            </div>
            <button
              type="button"
              onClick={() => { setEditingProspect(null); setShowProspectForm(true); }}
              className="lg:hidden bg-arbor-green text-stone-950 h-9 w-9 flex items-center justify-center hover:bg-arbor-green-dark shrink-0 mt-1"
              title="Quick add prospect (Cmd/Ctrl+K)"
              aria-label="Add prospect"
            >
              <Plus size={16} />
            </button>
          </div>
          <nav className="-mx-4 sm:-mx-6 lg:mx-0 overflow-x-auto scrollbar-thin">
            <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 lg:px-0 pb-2 lg:pb-0 min-w-max">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'activity', label: 'Activity' },
                { id: 'pipeline', label: 'Prospects' },
                { id: 'partners', label: 'Partners' },
                { id: 'leads', label: 'Leads' },
                { id: 'pastclients', label: 'Past Clients' },
                { id: 'jessica', label: 'Social Outreach' },
                { id: 'calendar', label: 'Calendar' },
                { id: 'settings', label: 'Settings' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
                    view === t.id
                      ? 'bg-arbor-green text-stone-950'
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ==================== OVERVIEW ==================== */}
        {view === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* North Star */}
            <section className="grid-bg border border-stone-800 p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 font-mono text-[9px] sm:text-[10px] tracking-[0.3em] text-stone-500 uppercase">North Star · This Month</div>
              <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8">
                <div className="flex-1">
                  <div className="font-mono text-[10px] sm:text-[11px] tracking-widest text-arbor-green uppercase mb-2">Face-to-Face Meetings Booked</div>
                  <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
                    <span className="font-display text-6xl sm:text-7xl lg:text-8xl font-medium text-stone-100 leading-none">{meetingsThisMonth}</span>
                    <span className="font-display text-2xl sm:text-3xl text-stone-500">/ {monthlyGoal}</span>
                    {monthDelta !== null && (
                      <span className={`font-mono text-[10px] uppercase tracking-wider ${monthDelta >= 0 ? 'text-arbor-green' : 'text-rose-400'}`}>
                        {monthDelta >= 0 ? '▲' : '▼'} {Math.abs(monthDelta)} vs last mo.
                      </span>
                    )}
                  </div>
                  <div className="mt-3 w-full max-w-md h-1 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-arbor-green transition-all"
                      style={{ width: `${Math.min(100, monthlyGoal ? (meetingsThisMonth / monthlyGoal) * 100 : 0)}%` }}
                    />
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                    Zooms + In-Persons logged this month, all owners
                  </div>
                </div>

                <div className="flex items-end justify-between lg:justify-end gap-6">
                  <div className="lg:mr-8">
                    <div className="font-mono text-[10px] tracking-widest text-stone-500 uppercase mb-2">Last 6 Months</div>
                    <Sparkline data={monthlyTrend} goal={monthlyGoal} />
                  </div>
                  <div className="text-right">
                    <label className="font-mono text-[10px] tracking-widest text-stone-500 uppercase block mb-1">Monthly Goal</label>
                    <input
                      type="number"
                      value={monthlyGoal}
                      onChange={e => setMonthlyGoal(parseInt(e.target.value) || 0)}
                      className="bg-stone-900 border border-stone-700 px-3 py-2 w-20 sm:w-24 text-right font-mono text-stone-100 focus:border-arbor-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Team scoreboard tiles */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <ScoreboardTile
                  label="New Leads This Month"
                  value={leadStats.cur.count}
                  delta={leadStats.cur.count - leadStats.prev.count}
                  sub={leadStats.prev.count > 0 ? `${leadStats.prev.count} last mo.` : 'no leads last month'}
                />
                <ScoreboardTile
                  label="Loans Funded This Month"
                  value={leadStats.cur.funded}
                  delta={leadStats.cur.funded - leadStats.prev.funded}
                  sub={`${formatCurrency(leadStats.cur.volume)} volume`}
                  accent={leadStats.cur.funded > 0}
                />
                <ScoreboardTile
                  label="Revenue This Month"
                  value={formatCurrency(leadStats.cur.revenue)}
                  delta={leadStats.cur.revenue - leadStats.prev.revenue}
                  deltaIsCurrency
                  sub={leadStats.prev.revenue > 0 ? `${formatCurrency(leadStats.prev.revenue)} last mo.` : 'no revenue last month'}
                  accent={leadStats.cur.revenue > 0}
                />
              </div>
            </section>

            {/* Weekly cadence */}
            <WeeklyCadence onOpenPipeline={() => { setView('pipeline'); setProspectsMode('board'); }} />

            {/* Pipeline funnel */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-stone-100">Prospects at a Glance</h2>
                <button onClick={() => { setView('pipeline'); setProspectsMode('board'); }} className="font-mono text-[11px] uppercase tracking-wider text-stone-400 hover:text-arbor-green flex items-center gap-1">
                  Open the board <ArrowRight size={12} />
                </button>
              </div>
              <PipelineFunnel stageCounts={stageCounts} onStageClick={() => { setView('pipeline'); setProspectsMode('board'); }} />
            </section>

            {/* Top Partners by Revenue */}
            <TopSourcesByRevenue prospects={prospects} leads={leads} onOpen={(p) => setDetailProspectId(p.id)} />

            {/* Stale Watch — prospects nobody has touched in STALE_DAYS+ days, by owner */}
            <StaleWatch prospects={activeProspects} onOpen={(p) => setDetailProspectId(p.id)} onLog={(id) => setShowActivityForm(id)} />

            {/* Recent activity */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-stone-100">Recent Activity</h2>
                <button onClick={() => setView('activity')} className="font-mono text-[11px] uppercase tracking-wider text-stone-400 hover:text-arbor-green flex items-center gap-1">
                  Full log <ArrowRight size={12} />
                </button>
              </div>
              <div className="bg-stone-900/30 border border-stone-800">
                {activities.slice(0, 8).map(a => {
                  const p = prospects.find(pp => pp.id === a.prospectId);
                  return (
                    <button
                      key={a.id}
                      onClick={() => p && setDetailProspectId(p.id)}
                      className="w-full px-4 py-3 border-b border-stone-800 last:border-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-left hover:bg-stone-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 sm:shrink-0">
                        <div className="font-mono text-[11px] text-stone-500 w-20 sm:w-24">{a.date}</div>
                        <div className="font-mono text-[11px] uppercase tracking-wider text-arbor-green w-20 sm:w-24">{a.type}</div>
                        <div className="font-mono text-[11px] text-stone-400 w-16 sm:w-20">{a.owner}</div>
                      </div>
                      <div className="text-stone-200 flex-1 min-w-0">
                        <span className="text-stone-100 font-medium">{p?.name || 'Unknown'}</span>
                        <span className="text-stone-500"> — {a.outcome}</span>
                      </div>
                    </button>
                  );
                })}
                {activities.length === 0 && (
                  <div className="px-4 py-8 text-center text-stone-500 font-mono text-sm">
                    No activity logged yet. Start by logging a touch on any prospect.
                  </div>
                )}
              </div>
            </section>

            {/* Next 7 days */}
            <NextActions prospects={activeProspects} onLog={(id) => setShowActivityForm(id)} onOpen={(p) => setDetailProspectId(p.id)} onDismiss={dismissNextAction} />
          </div>
        )}

        {/* ==================== PROSPECTS (merged Board + List) ==================== */}
        {view === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-2xl sm:text-3xl text-stone-100">Prospects</h2>
                {/* Board / List toggle */}
                <div className="flex items-center gap-1 p-1 bg-stone-900/40 border border-stone-800">
                  {[
                    { id: 'list', label: 'List' },
                    { id: 'board', label: 'Board' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setProspectsMode(m.id)}
                      className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
                        prospectsMode === m.id ? 'bg-arbor-green text-stone-950' : 'text-stone-400 hover:text-stone-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setEditingProspect(null); setShowProspectForm(true); }} className="bg-arbor-green text-stone-950 px-3 sm:px-4 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-arbor-green-dark whitespace-nowrap">
                <Plus size={14} /> <span className="hidden sm:inline">Add Prospect</span><span className="sm:hidden">Add</span>
              </button>
            </div>

            {prospectsMode === 'board' ? (
              <PipelineBoard
                prospects={activeProspects}
                onEdit={(p) => { setEditingProspect(p); setShowProspectForm(true); }}
                onLog={(id) => setShowActivityForm(id)}
                onAdd={() => { setEditingProspect(null); setShowProspectForm(true); }}
                onOpen={(p) => setDetailProspectId(p.id)}
                onAdvance={advanceStage}
                hideHeader
              />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-stone-900/30 border border-stone-800">
                  <div className="flex items-center gap-2 flex-1">
                    <Search size={14} className="text-stone-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search name, firm, city... (press / from anywhere)"
                      value={searchTerm}
                      data-search="prospects"
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-transparent flex-1 min-w-0 text-sm text-stone-100 placeholder-stone-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="bg-stone-900 border border-stone-700 text-stone-200 px-2 py-1 text-xs font-mono flex-1 sm:flex-initial">
                      <option value="All">All Owners</option>
                      {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-stone-900 border border-stone-700 text-stone-200 px-2 py-1 text-xs font-mono flex-1 sm:flex-initial">
                      <option value="All">All Types</option>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {archivedCount > 0 && (
                      <button
                        onClick={() => setShowArchived(v => !v)}
                        className={`px-2 py-1 text-xs font-mono uppercase tracking-wider border whitespace-nowrap ${
                          showArchived
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                            : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
                        }`}
                        title={showArchived ? 'Hide archived prospects' : 'Show archived prospects'}
                      >
                        {showArchived ? <ArchiveRestore size={11} className="inline mr-1 -mt-px" /> : <Archive size={11} className="inline mr-1 -mt-px" />}
                        {showArchived ? `Hiding none · ${archivedCount} archived` : `+${archivedCount} archived`}
                      </button>
                    )}
                  </div>
                </div>
                {/* Desktop table */}
                <div className="bg-stone-900/30 border border-stone-800 hidden md:block">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-stone-800 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                    <div className="col-span-3">Name / Firm</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Stage</div>
                    <div className="col-span-1">Owner</div>
                    <div className="col-span-2">Next Action</div>
                    <div className="col-span-1">Last Touch</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>
                  {filtered.map(p => (
                    <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-stone-800 last:border-0 items-center text-sm hover:bg-stone-900/40">
                      <div className="col-span-3 flex items-start gap-2">
                        <button onClick={() => setDetailProspectId(p.id)} className="text-left group min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-stone-100 group-hover:text-arbor-green transition-colors truncate">{p.name}</span>
                            {p.eiosId && <span className="font-mono text-[9px] text-arbor-green/70" title={`EiOS ID: ${p.eiosId}`}>◉</span>}
                            <StalenessDot lastTouch={p.lastTouch} stage={p.stage} />
                          </div>
                          <div className="text-xs text-stone-500 truncate">{p.firm}</div>
                        </button>
                        <ContactBadges prospect={p} />
                      </div>
                      <div className={`col-span-2 font-mono text-[11px] ${TYPE_COLORS[p.type]}`}>{p.type}</div>
                      <div className="col-span-2"><span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border ${STAGE_COLORS[p.stage]}`}>{p.stage}</span></div>
                      <div className="col-span-1 font-mono text-xs text-stone-300">{p.owner}</div>
                      <div className="col-span-2 text-xs text-stone-300 truncate">{p.nextAction || <span className="text-stone-600 italic">—</span>}</div>
                      <div className="col-span-1 font-mono text-[11px] text-stone-500">{p.lastTouch || '—'}</div>
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        {p.eiosId && eiosConfig.baseUrl && (
                          <a href={`${eiosConfig.baseUrl}${p.eiosId}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-arbor-green" title="Open in EiOS">
                            <span className="font-mono text-[11px]">⎘</span>
                          </a>
                        )}
                        <button onClick={() => setShowActivityForm(p.id)} className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-arbor-green" title="Log activity"><Activity size={13} /></button>
                        <button onClick={() => { setEditingProspect(p); setShowProspectForm(true); }} className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-100" title="Edit"><Edit2 size={13} /></button>
                        <button onClick={() => deleteProspect(p.id)} className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-rose-400" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-4 py-12 text-center text-stone-500 text-sm font-mono">No matches.</div>
                  )}
                </div>
                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {filtered.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setDetailProspectId(p.id)}
                      className="w-full bg-stone-900/30 border border-stone-800 p-3 text-left hover:border-arbor-green/40 transition-colors block"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-stone-100 truncate">{p.name}</span>
                            {p.eiosId && <span className="font-mono text-[9px] text-arbor-green/70 shrink-0">◉</span>}
                            <StalenessDot lastTouch={p.lastTouch} stage={p.stage} />
                            <ContactBadges prospect={p} />
                          </div>
                          <div className="text-xs text-stone-500 truncate">{p.firm}</div>
                        </div>
                        <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border ${STAGE_COLORS[p.stage]} shrink-0`}>{p.stage}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 mt-2">
                        <span className={TYPE_COLORS[p.type]}>{p.type}</span>
                        <span>·</span>
                        <span>{p.owner}</span>
                        {p.lastTouch && <><span>·</span><span>last {p.lastTouch}</span></>}
                      </div>
                      {p.nextAction && (
                        <div className="text-xs text-stone-300 mt-2 border-l border-arbor-green/40 pl-2 italic">{p.nextAction}</div>
                      )}
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-4 py-12 text-center text-stone-500 text-sm font-mono bg-stone-900/30 border border-stone-800">No matches.</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== SOCIAL OUTREACH ==================== */}
        {view === 'jessica' && (
          <SocialOutreachView
            prospects={activeProspects}
            activities={activities}
            onEdit={(p) => { setEditingProspect(p); setShowProspectForm(true); }}
            onLogSocial={(prospectId) => setShowActivityForm({
              prospectId,
              defaults: {
                type: 'Social Engage',
                outcome: '',
              },
            })}
            onOpen={(p) => setDetailProspectId(p.id)}
          />
        )}

        {/* ==================== PAST CLIENTS ==================== */}
        {view === 'pastclients' && (
          <PastClientsView
            prospects={activeProspects}
            allProspects={prospects}
            activities={activities}
            onEdit={(p) => { setEditingProspect(p); setShowProspectForm(true); }}
            onLog={(id) => setShowActivityForm(id)}
            onLogCadence={(prospectId, item) => setShowActivityForm({
              prospectId,
              defaults: {
                type: 'Call',
                owner: item.owner,
                outcome: item.prefillOutcome,
              },
            })}
            onOpen={(p) => setDetailProspectId(p.id)}
            onCaptureEcosystem={captureEcosystemProspect}
            onPullFromEios={pullPastClientsFromEios}
          />
        )}

        {/* ==================== PARTNERS ==================== */}
        {view === 'partners' && (
          <PartnersView
            prospects={activeProspects}
            leads={leads}
            onOpen={(p) => setDetailProspectId(p.id)}
            onAddLead={(prospectId) => setShowLeadForm({ prospectId })}
          />
        )}

        {/* ==================== LEADS ==================== */}
        {view === 'leads' && (
          <LeadsView
            leads={leads}
            prospects={prospects}
            onAdd={() => setShowLeadForm({ prospectId: '' })}
            onEdit={(lead) => setShowLeadForm({ prospectId: lead.prospectId, lead })}
            onDelete={deleteLead}
            onOpen={(p) => setDetailProspectId(p.id)}
          />
        )}

        {/* ==================== CALENDAR ==================== */}
        {view === 'calendar' && (
          <CalendarView
            events={events}
            prospects={prospects}
            onAdd={() => setShowEventForm({})}
            onEdit={(ev) => setShowEventForm(ev)}
            onDelete={deleteEvent}
            onOpen={(p) => setDetailProspectId(p.id)}
          />
        )}

        {/* ==================== ACTIVITY ==================== */}
        {view === 'activity' && (
          <ActivityView activities={activities} prospects={prospects} />
        )}

        {/* ==================== SETTINGS ==================== */}
        {view === 'settings' && (
          <SettingsView config={eiosConfig} onChange={setEiosConfig} prospects={prospects} activities={activities} />
        )}
      </main>

      {/* MODALS */}
      {showProspectForm && (
        <ProspectForm
          initial={editingProspect}
          onSave={saveProspect}
          onClose={() => { setShowProspectForm(false); setEditingProspect(null); }}
          pushToast={pushToast}
        />
      )}
      {showActivityForm && (() => {
        const id = typeof showActivityForm === 'string' ? showActivityForm : showActivityForm.prospectId;
        const defaults = typeof showActivityForm === 'object' ? showActivityForm.defaults : null;
        return (
          <ActivityForm
            prospect={prospects.find(p => p.id === id)}
            defaults={defaults}
            onSave={logActivity}
            onClose={() => setShowActivityForm(null)}
            pushToast={pushToast}
          />
        );
      })()}
      {detailProspectId && (
        <ProspectDetail
          prospect={prospects.find(p => p.id === detailProspectId)}
          activities={activities.filter(a => a.prospectId === detailProspectId)}
          leads={leads.filter(l => l.prospectId === detailProspectId)}
          eiosConfig={eiosConfig}
          onClose={() => setDetailProspectId(null)}
          onEdit={(p) => { setEditingProspect(p); setShowProspectForm(true); }}
          onLog={(id) => setShowActivityForm(id)}
          onDelete={deleteProspect}
          onAdvance={advanceStage}
          onRequestCode={requestCodeDossier}
          onArchive={(id, archived) => setArchived(id, archived)}
          onAddLead={(prospectId) => setShowLeadForm({ prospectId })}
          onEditLead={(lead) => setShowLeadForm({ prospectId: lead.prospectId, lead })}
          onDeleteLead={deleteLead}
        />
      )}
      {showLeadForm && (
        <LeadForm
          initial={showLeadForm.lead}
          defaultProspectId={showLeadForm.prospectId}
          prospects={prospects}
          onSave={saveLead}
          onClose={() => setShowLeadForm(null)}
          pushToast={pushToast}
        />
      )}
      {showEventForm && (
        <EventForm
          initial={showEventForm.id ? showEventForm : null}
          prospects={prospects}
          onSave={saveEvent}
          onClose={() => setShowEventForm(null)}
          pushToast={pushToast}
        />
      )}
      {confirmState && (
        <ConfirmDialog
          {...confirmState}
          onCancel={() => setConfirmState(null)}
        />
      )}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Add N days to a YYYY-MM-DD date and return YYYY-MM-DD.
function addDays(ymd, n) {
  if (!ymd) return '';
  const d = new Date(ymd + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Compute the status of a cadence touchpoint for a past client.
// Returns { status: 'done'|'overdue'|'due'|'upcoming', dueDate, doneActivity? }
function getCadenceStatus(prospect, activities, item) {
  if (!prospect.closedAt) return { status: 'unknown', dueDate: null };
  const dueDate = addDays(prospect.closedAt, item.days);
  const today = new Date().toISOString().slice(0, 10);
  // A touchpoint is done if there's any activity for this prospect, dated on
  // or after closedAt, whose outcome contains the cadence outcomeMatch fragment.
  const doneActivity = activities.find(a =>
    a.prospectId === prospect.id &&
    a.date >= prospect.closedAt &&
    (a.outcome || '').toLowerCase().includes(item.outcomeMatch.toLowerCase())
  );
  if (doneActivity) return { status: 'done', dueDate, doneActivity };
  const overdueDate = addDays(dueDate, item.graceDays);
  if (today > overdueDate) return { status: 'overdue', dueDate };
  if (today >= dueDate) return { status: 'due', dueDate };
  return { status: 'upcoming', dueDate };
}

// Format USD currency, no cents above $1k.
function formatCurrency(n) {
  const v = Number(n) || 0;
  if (v === 0) return '$0';
  if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(v >= 10000000 ? 0 : 1)}M`;
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

const STALE_DAYS = 14;

// Most-recent social-touch date (LinkedIn DM, Social Engage) for a prospect.
// Returns ISO YYYY-MM-DD or null if no social touches exist.
function getLastSocialTouch(prospectId, activities) {
  const social = activities
    .filter(a => a.prospectId === prospectId && SOCIAL_TOUCH_TYPES.has(a.type) && a.date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return social[0]?.date || null;
}

// Days since a YYYY-MM-DD touch date.
function daysSince(ymd) {
  if (!ymd) return null;
  const then = new Date(ymd + 'T00:00:00');
  if (isNaN(then.getTime())) return null;
  return Math.floor((Date.now() - then.getTime()) / 86400000);
}

function StalenessDot({ lastTouch, stage }) {
  if (stage === 'Activated Partner' || stage === 'Cold') return null;
  const days = daysSince(lastTouch);
  if (days === null) return <span className="w-1.5 h-1.5 rounded-full bg-rose-500/70 inline-block shrink-0" title="Never touched" />;
  if (days >= 21) return <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" title={`${days} days since last touch — stale`} />;
  if (days >= 10) return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" title={`${days} days since last touch`} />;
  return <span className="w-1.5 h-1.5 rounded-full bg-arbor-green inline-block shrink-0" title={`${days} days since last touch`} />;
}

function PipelineCard({ prospect, onEdit, onLog, onOpen, draggable, onDragStart, onDragEnd, isDragging }) {
  const days = daysSince(prospect.lastTouch);
  const staleLabel = days === null ? 'never' : days === 0 ? 'today' : days === 1 ? '1d' : `${days}d`;
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`bg-stone-900 border border-stone-800 p-3 hover:border-arbor-green/40 transition-all group cursor-pointer ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <StalenessDot lastTouch={prospect.lastTouch} stage={prospect.stage} />
          <div className="font-medium text-stone-100 text-sm leading-tight truncate">{prospect.name}</div>
          <ContactBadges prospect={prospect} />
        </div>
        <span className={`font-mono text-[9px] uppercase ${TYPE_COLORS[prospect.type]} shrink-0`}>{prospect.type.split(' ')[0]}</span>
      </div>
      <div className="text-[11px] text-stone-500 mb-2 truncate">{prospect.firm}</div>
      {prospect.nextAction && (
        <div className="text-[11px] text-stone-300 border-l border-arbor-green/40 pl-2 mb-2 italic line-clamp-2">
          {prospect.nextAction}
        </div>
      )}
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-stone-500">{prospect.owner} · {staleLabel}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onLog(); }} className="px-2 py-0.5 bg-arbor-green/20 text-arbor-green hover:bg-arbor-green/30 uppercase tracking-wider">Log</button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-2 py-0.5 bg-stone-800 text-stone-300 hover:bg-stone-700 uppercase tracking-wider">Edit</button>
        </div>
      </div>
    </div>
  );
}

function PipelineBoard({ prospects, onEdit, onLog, onAdd, onOpen, onAdvance, hideHeader }) {
  const [draggingId, setDraggingId] = useState(null);
  const [hoverStage, setHoverStage] = useState(null);

  const handleDrop = (stage) => {
    if (draggingId) onAdvance(draggingId, stage);
    setDraggingId(null);
    setHoverStage(null);
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-stone-100">Prospects</h2>
            <div className="font-mono text-[10px] tracking-widest text-stone-500 uppercase mt-1 hidden sm:block">Drag a card across columns to advance the stage · Cold → Activated Partner</div>
          </div>
          <button onClick={onAdd} className="bg-arbor-green text-stone-950 px-3 sm:px-4 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-arbor-green-dark whitespace-nowrap">
            <Plus size={14} /> <span className="hidden sm:inline">Add Prospect</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      )}
      {hideHeader && (
        <div className="font-mono text-[10px] tracking-widest text-stone-500 uppercase hidden sm:block">Drag a card across columns to advance the stage · Cold → Activated Partner</div>
      )}
      <div className="-mx-4 sm:-mx-6 lg:mx-0 overflow-x-auto">
        <div className="grid grid-cols-5 gap-3 px-4 sm:px-6 lg:px-0 min-w-[900px] lg:min-w-0">
          {STAGES.map(stage => (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setHoverStage(stage); }}
              onDragLeave={() => setHoverStage(s => s === stage ? null : s)}
              onDrop={() => handleDrop(stage)}
              className={`bg-stone-900/30 border min-h-[400px] transition-colors ${hoverStage === stage ? 'border-arbor-green bg-arbor-green/5' : 'border-stone-800'}`}
            >
              <div className={`px-3 py-2 border-b border-stone-800 font-mono text-[10px] uppercase tracking-wider flex items-center justify-between ${STAGE_COLORS[stage].split(' ')[1]}`}>
                <span>{stage}</span>
                <span className="text-stone-500">{prospects.filter(p => p.stage === stage).length}</span>
              </div>
              <div className="p-2 space-y-2">
                {prospects.filter(p => p.stage === stage).map(p => (
                  <PipelineCard
                    key={p.id}
                    prospect={p}
                    onEdit={() => onEdit(p)}
                    onLog={() => onLog(p.id)}
                    onOpen={() => onOpen(p)}
                    draggable
                    onDragStart={(e) => { setDraggingId(p.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDraggingId(null); setHoverStage(null); }}
                    isDragging={draggingId === p.id}
                  />
                ))}
                {prospects.filter(p => p.stage === stage).length === 0 && (
                  <div className="px-2 py-6 text-center text-stone-600 text-[11px] font-mono italic">drop here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NextActions({ prospects, onLog, onOpen, onDismiss }) {
  const today = new Date().toISOString().slice(0, 10);
  const next7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const due = prospects
    .filter(p => p.nextAction && p.nextActionDate && p.nextActionDate <= next7)
    .sort((a, b) => (a.nextActionDate || '').localeCompare(b.nextActionDate || ''));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-stone-100">Next 7 Days</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{due.length} actions queued</span>
      </div>
      {due.length === 0 ? (
        <div className="bg-stone-900/30 border border-stone-800 px-4 py-8 text-center text-stone-500 font-mono text-sm">
          No queued actions in the next 7 days. Add next actions to your prospects.
        </div>
      ) : (
        <div className="bg-stone-900/30 border border-stone-800">
          {due.map(p => {
            const overdue = p.nextActionDate < today;
            return (
              <div key={p.id} className="px-4 py-3 border-b border-stone-800 last:border-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`font-mono text-[11px] w-24 ${overdue ? 'text-rose-400' : 'text-stone-400'}`}>
                    {overdue && <AlertCircle size={11} className="inline mr-1" />}
                    {p.nextActionDate}
                  </div>
                  <div className="font-mono text-[11px] text-stone-500 w-20">{p.owner}</div>
                </div>
                <button
                  onClick={() => onOpen ? onOpen(p) : onLog(p.id)}
                  className="flex-1 text-left min-w-0 group"
                >
                  <div className="text-stone-100 font-medium group-hover:text-arbor-green transition-colors">{p.name} <span className="text-stone-500 font-normal">· {p.firm}</span></div>
                  <div className="text-xs text-stone-300 mt-0.5">{p.nextAction}</div>
                </button>
                <div className="flex items-center gap-1 self-start sm:self-auto">
                  <button onClick={() => onLog(p.id)} className="px-3 py-1 bg-arbor-green/20 text-arbor-green hover:bg-arbor-green/30 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">
                    Log Done
                  </button>
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(p.id)}
                      className="px-2 py-1 text-stone-500 hover:text-rose-400 hover:bg-stone-900 font-mono text-[10px] uppercase tracking-wider"
                      title="Drop this action without logging a touch — it's no longer relevant"
                      aria-label="Dismiss next action"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SocialOutreachView({ prospects, activities, onEdit, onLogSocial, onOpen }) {
  // The Social Incubator: every active prospect (and past client) who isn't
  // already an Activated Partner. Ranked by social staleness — never-touched
  // first, then oldest social touch, capped at top 50.
  const TOP_N = 50;
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const incubatorPool = useMemo(() => prospects
    .filter(p => p.stage !== 'Activated Partner')
    .map(p => {
      const lastSocial = getLastSocialTouch(p.id, activities);
      const daysSinceSocial = lastSocial ? daysSince(lastSocial) : null;
      // Sort score: never = highest priority (use 99999), otherwise daysSinceSocial.
      const score = daysSinceSocial === null ? 99999 : daysSinceSocial;
      return { p, lastSocial, daysSinceSocial, score };
    })
    .sort((a, b) => b.score - a.score), [prospects, activities]);

  const top50 = incubatorPool.slice(0, TOP_N);

  // Coverage stats over the top 50 (the working list, not the whole pool).
  const linkedinSet = top50.filter(({ p }) => !!p.linkedinUrl).length;
  const touchedThisWeek = top50.filter(({ lastSocial }) => lastSocial && lastSocial >= weekStartStr).length;
  const touchedLast30 = top50.filter(({ lastSocial }) => lastSocial && lastSocial >= monthAgo).length;
  const staleOrNever = top50.filter(({ daysSinceSocial }) => daysSinceSocial === null || daysSinceSocial >= 14).length;

  // All-time meetings sourced via social engagement (any owner)
  const meetingsFromSocial = activities.filter(a => {
    if (!(a.type === 'Zoom' || a.type === 'In-Person')) return false;
    // Heuristic: meeting was preceded by a social touch on the same prospect
    const earlierSocial = activities.find(o =>
      o.prospectId === a.prospectId &&
      SOCIAL_TOUCH_TYPES.has(o.type) &&
      o.date < a.date
    );
    return !!earlierSocial;
  }).length;

  const weeklyTouchGoal = TOP_N; // touch every one of the top 50 each week

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-arbor-green uppercase">Operating Playbook</div>
        <h2 className="font-display text-2xl sm:text-3xl text-stone-100 mt-1">Social Outreach</h2>
        <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-1">A channel — runs across all prospects, past clients, and ecosystem captures</div>
      </div>

      {/* Mission */}
      <div className="bg-stone-900/30 border border-stone-800 p-5 sm:p-6">
        <div className="font-mono text-[10px] tracking-widest text-arbor-green uppercase mb-3">The Mission</div>
        <ul className="space-y-2.5 text-sm sm:text-base text-stone-200 leading-relaxed">
          <li className="flex gap-3"><span className="font-mono text-arbor-green text-xs mt-1 shrink-0">[01]</span> Engage our top 50 prospects on social.</li>
          <li className="flex gap-3"><span className="font-mono text-arbor-green text-xs mt-1 shrink-0">[02]</span> Engage all past clients — capture their social links.</li>
          <li className="flex gap-3"><span className="font-mono text-arbor-green text-xs mt-1 shrink-0">[03]</span> Engage every new prospect added via past-client outreach.</li>
        </ul>
      </div>

      {/* Coverage KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPI label="Top 50 Coverage" value={`${top50.length}/${TOP_N}`} sub={`${incubatorPool.length} eligible · drawing from full pool`} accent={top50.length >= TOP_N} />
        <KPI label="LinkedIn Captured" value={`${linkedinSet}/${top50.length}`} sub={top50.length - linkedinSet > 0 ? `${top50.length - linkedinSet} need URL` : 'all linked'} accent={top50.length > 0 && linkedinSet === top50.length} />
        <KPI label="Touched This Week" value={`${touchedThisWeek}/${weeklyTouchGoal}`} sub={`${touchedLast30} touched in last 30d`} accent={touchedThisWeek >= weeklyTouchGoal} />
        <KPI label="Stale or Never" value={staleOrNever} sub={`No social touch in 14+ days`} />
      </div>

      {/* Weekly cadence + DM sequence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-stone-900/30 border border-stone-800 p-5">
          <div className="font-mono text-[10px] tracking-widest text-stone-500 uppercase mb-3">Weekly Cadence</div>
          <ul className="space-y-2 text-sm text-stone-200">
            <li className="flex gap-3"><span className="font-mono text-arbor-green text-xs w-8">MON</span> 10 connection requests + 5 comments on top-50 posts</li>
            <li className="flex gap-3"><span className="font-mono text-arbor-green text-xs w-8">TUE</span> 10 warm DMs to "Touched" / "Engaged" prospects · share 1 Arbor post</li>
            <li className="flex gap-3"><span className="font-mono text-arbor-green text-xs w-8">WED</span> 10 follow-up DMs + 1 voice memo to top-3 most-engaged</li>
            <li className="flex gap-3"><span className="font-mono text-arbor-green text-xs w-8">THU</span> 10 new outreach · book any Partner Preview Zooms for next 2 wks</li>
            <li className="flex gap-3"><span className="font-mono text-arbor-green text-xs w-8">FRI</span> 10 social engagements · log all · review the Stale Watch with Ryan</li>
          </ul>
        </div>
        <div className="bg-stone-900/30 border border-stone-800 p-5">
          <div className="font-mono text-[10px] tracking-widest text-stone-500 uppercase mb-3">The DM Sequence</div>
          <ol className="space-y-3 text-sm text-stone-200">
            <li><span className="font-mono text-arbor-green text-xs">[01]</span> Connection request — no pitch. Reference something specific from their profile.</li>
            <li><span className="font-mono text-arbor-green text-xs">[02]</span> Day 3 after accept: comment on a recent post (substantive, not "great post").</li>
            <li><span className="font-mono text-arbor-green text-xs">[03]</span> Day 7: short DM — "I run partner programs at Arbor — saw [specific thing], thought of you. Would a 15-min Partner Preview be worth it?"</li>
            <li><span className="font-mono text-arbor-green text-xs">[04]</span> If yes: book Zoom directly with Ryan or Dave via Calendly. Hand off cleanly.</li>
            <li><span className="font-mono text-arbor-green text-xs">[05]</span> If no response: 2-week pause. Re-engage with a value asset (one-pager, post, event invite).</li>
          </ol>
        </div>
      </div>

      {/* The Social Incubator */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-xl text-stone-100">The Social Incubator</h3>
            <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">Top {TOP_N} ranked by social staleness · never-touched first, then oldest engagement</div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">All-time meetings sourced via social: <span className="text-arbor-green">{meetingsFromSocial}</span></span>
        </div>
        <div className="bg-stone-900/30 border border-stone-800">
          {top50.length === 0 ? (
            <div className="px-4 py-12 text-center text-stone-500 text-sm font-mono">
              No prospects in the incubator yet. Active prospects + past clients (excluding Activated Partners) feed in automatically.
            </div>
          ) : (
            top50.map(({ p, daysSinceSocial }, i) => {
              const recencyTone =
                daysSinceSocial === null ? 'text-rose-400' :
                daysSinceSocial >= 21 ? 'text-rose-400' :
                daysSinceSocial >= 10 ? 'text-amber-300' :
                daysSinceSocial >= 4 ? 'text-stone-300' :
                'text-arbor-green';
              return (
                <div key={p.id} className="px-4 py-3 border-b border-stone-800 last:border-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 text-sm">
                  <div className="flex items-center gap-3 md:w-1/3 min-w-0">
                    <span className="font-mono text-[10px] text-stone-600 w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <button onClick={() => onOpen(p)} className="text-left min-w-0 flex-1 group">
                      <div className="font-medium text-stone-100 group-hover:text-arbor-green transition-colors truncate">{p.name}</div>
                      <div className="text-[11px] text-stone-500 truncate">{p.firm}</div>
                    </button>
                    <ContactBadges prospect={p} />
                  </div>
                  <div className="flex items-center gap-3 md:w-1/4 flex-wrap">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${TYPE_COLORS[p.type]}`}>{p.type.split(' ')[0]}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0 border ${STAGE_COLORS[p.stage]}`}>{p.stage}</span>
                    <span className="font-mono text-[10px] text-stone-500">{p.owner}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {p.linkedinUrl ? (
                      <a
                        href={p.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-[10px] uppercase tracking-wider text-arbor-green hover:text-arbor-green-dark inline-flex items-center gap-1"
                      >
                        <Linkedin size={10} /> Open
                      </a>
                    ) : (
                      <button
                        onClick={() => onEdit(p)}
                        className="font-mono text-[10px] uppercase tracking-wider text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 border border-amber-500/40 bg-amber-950/30 px-1.5 py-0.5"
                        title="Add LinkedIn URL on the prospect"
                      >
                        + LinkedIn
                      </button>
                    )}
                    <span className={`font-mono text-[11px] ${recencyTone} shrink-0`}>
                      {daysSinceSocial === null ? 'never engaged' : `${daysSinceSocial}d ago`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 md:justify-end">
                    <button onClick={() => onLogSocial(p.id)} className="px-2 py-1 bg-arbor-green/20 text-arbor-green hover:bg-arbor-green/30 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Log Social</button>
                    <button onClick={() => onEdit(p)} className="p-1.5 hover:bg-stone-800 text-stone-400"><Edit2 size={13} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {incubatorPool.length > TOP_N && (
          <div className="mt-2 text-center font-mono text-[10px] text-stone-500 uppercase tracking-wider">
            Showing top {TOP_N} of {incubatorPool.length} eligible · the queue refills as you engage them
          </div>
        )}
      </div>
    </div>
  );
}

function PastClientsView({ prospects, allProspects, activities, onEdit, onLog, onLogCadence, onOpen, onCaptureEcosystem, onPullFromEios }) {
  const [captureFor, setCaptureFor] = useState(null); // { pastClient, role }
  const past = prospects.filter(p => p.type === 'Past Client' && ['Ryan', 'Dave', 'Taylor'].includes(p.owner));

  // Per past-client ecosystem index — find prospects (any type) that were
  // referred by this past client.
  const ecosystemByClient = useMemo(() => {
    const idx = {};
    past.forEach(pc => { idx[pc.id] = []; });
    (allProspects || prospects).forEach(p => {
      if (p.referredByPastClientId && idx[p.referredByPastClientId]) {
        idx[p.referredByPastClientId].push(p);
      }
    });
    return idx;
  }, [past, allProspects, prospects]);

  // KPIs
  const totalEcosystem = past.reduce((sum, pc) => sum + (ecosystemByClient[pc.id]?.length || 0), 0);
  const askedCount = past.filter(pc => (ecosystemByClient[pc.id]?.length || 0) > 0 || pc.ecosystemAskedAt).length;
  const advancedFromEcosystem = past.reduce((sum, pc) => {
    const eco = ecosystemByClient[pc.id] || [];
    return sum + eco.filter(e => e.stage !== 'Cold').length;
  }, 0);
  const fundedFromEcosystem = past.reduce((sum, pc) => {
    const eco = ecosystemByClient[pc.id] || [];
    return sum + eco.filter(e => e.stage === 'Activated Partner').length;
  }, 0);

  // Post-close cadence (existing)
  const inCadenceWindow = past
    .filter(p => p.closedAt)
    .map(p => {
      const items = PAST_CLIENT_CADENCE.map(c => ({ item: c, status: getCadenceStatus(p, activities, c) }));
      const dueCount = items.filter(s => s.status.status === 'overdue' || s.status.status === 'due').length;
      const lastTouchpointDue = addDays(p.closedAt, 90 + 14);
      const today = new Date().toISOString().slice(0, 10);
      const stillInWindow = today <= lastTouchpointDue;
      return { p, items, dueCount, stillInWindow };
    })
    .filter(({ stillInWindow }) => stillInWindow)
    .sort((a, b) => b.dueCount - a.dueCount || a.p.closedAt.localeCompare(b.p.closedAt));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-arbor-green uppercase">Highest-Yield Channel</div>
          <h2 className="font-display text-2xl sm:text-3xl text-stone-100 mt-1">Past Clients · Ecosystem Capture</h2>
          <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-1">Synced from EiOS · roles: Ryan, Dave, Taylor</div>
        </div>
        <button
          onClick={onPullFromEios}
          className="bg-stone-800 text-stone-200 px-3 sm:px-4 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-stone-700 whitespace-nowrap"
          title="Request EiOS to push the latest list of past clients into this dashboard"
        >
          ⇣ Pull from EiOS
        </button>
      </div>

      <div className="bg-stone-900/30 border border-stone-800 p-5 sm:p-6">
        <div className="font-mono text-[10px] tracking-widest text-arbor-green uppercase mb-3">The Ecosystem Strategy</div>
        <p className="text-stone-200 font-display text-lg sm:text-xl leading-relaxed mb-3">
          "It's a best practice for me to update your CPA, financial advisor, and trust attorney with your new mortgage info. Who are they?"
        </p>
        <p className="text-stone-400 text-sm leading-relaxed">
          The play: every past client has a CPA, FA, and an attorney they trust. Get those names. Reach out with a warm intro — we already have a client in common. It should be a layup. Below: every past client of Ryan/Dave/Taylor and the three slots for their ecosystem. Filled = a prospect already exists. Empty = ask + capture.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPI label="Past Clients" value={past.length} sub="From EiOS · Ryan/Dave/Taylor" />
        <KPI label="Asked / Captured" value={`${askedCount}/${past.length}`} sub={`${past.length ? Math.round(100 * askedCount / past.length) : 0}% of pool`} accent={askedCount > 0} />
        <KPI label="Ecosystem Prospects" value={totalEcosystem} sub={`${advancedFromEcosystem} engaged or beyond`} accent={totalEcosystem > 0} />
        <KPI label="Activated From This" value={fundedFromEcosystem} sub="Became a partner" accent />
      </div>

      {/* Post-Close Cadence Watch */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-xl text-stone-100">Post-Close Cadence</h3>
            <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">
              Margaret 30d + 90d check-ins · Taylor 45d partner ask · within 90 days of funding
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{inCadenceWindow.length} in window</span>
        </div>
        {inCadenceWindow.length === 0 ? (
          <div className="bg-stone-900/30 border border-stone-800 px-4 py-8 text-center text-stone-500 font-mono text-sm">
            No past clients in their first 90 days. Add a closed date on past-client prospects to surface them here.
          </div>
        ) : (
          <div className="bg-stone-900/30 border border-stone-800 divide-y divide-stone-800">
            {inCadenceWindow.map(({ p, items }) => {
              const closedDays = daysSince(p.closedAt);
              return (
                <div key={p.id} className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
                  <button onClick={() => onOpen(p)} className="lg:w-1/4 text-left min-w-0 group">
                    <div className="font-medium text-stone-100 group-hover:text-arbor-green transition-colors truncate">{p.name}</div>
                    <div className="text-[11px] text-stone-500 truncate font-mono">closed {p.closedAt} · day {closedDays}</div>
                  </button>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {items.map(({ item, status }) => {
                      const tone =
                        status.status === 'done' ? 'bg-arbor-green/15 text-arbor-green border-arbor-green/40' :
                        status.status === 'overdue' ? 'bg-rose-950/40 text-rose-300 border-rose-500/40' :
                        status.status === 'due' ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' :
                        'bg-stone-950/40 text-stone-500 border-stone-800';
                      const clickable = status.status === 'overdue' || status.status === 'due';
                      const Tag = clickable ? 'button' : 'div';
                      return (
                        <Tag
                          key={item.id}
                          onClick={clickable ? () => onLogCadence(p.id, item) : undefined}
                          className={`px-2.5 py-1 border ${tone} ${clickable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'} text-left min-w-0`}
                          title={clickable ? `Log ${item.label} · ${item.owner}` : status.status === 'done' ? `Done ${status.doneActivity?.date}` : `Due ${status.dueDate}`}
                        >
                          <div className="font-mono text-[9px] uppercase tracking-wider opacity-80">{item.label} · {item.owner}</div>
                          <div className="font-mono text-[10px]">
                            {status.status === 'done' && `✓ done ${status.doneActivity?.date}`}
                            {status.status === 'overdue' && `⚠ overdue · was due ${status.dueDate}`}
                            {status.status === 'due' && `due ${status.dueDate}`}
                            {status.status === 'upcoming' && `upcoming · ${status.dueDate}`}
                          </div>
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-past-client ecosystem capture */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl text-stone-100">The Ecosystem Roster</h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{past.length} past clients · sorted by ecosystem gaps</span>
        </div>
        <div className="space-y-2">
          {past
            .map(pc => ({ pc, eco: ecosystemByClient[pc.id] || [] }))
            .sort((a, b) => a.eco.length - b.eco.length || (a.pc.lastTouch || '0').localeCompare(b.pc.lastTouch || '0'))
            .map(({ pc, eco }) => {
              const filledRoles = new Set(eco.map(e => e.type));
              return (
                <div key={pc.id} className="bg-stone-900/30 border border-stone-800 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => onOpen(pc)} className="font-medium text-stone-100 hover:text-arbor-green transition-colors">{pc.name}</button>
                        <ContactBadges prospect={pc} />
                        <span className="font-mono text-[10px] text-stone-500">{pc.owner}</span>
                        {pc.eiosId && <span className="font-mono text-[9px] text-arbor-green/70" title={`EiOS ID: ${pc.eiosId}`}>◉</span>}
                      </div>
                      <div className="text-xs text-stone-500 truncate">{pc.firm}{pc.closedAt && ` · closed ${pc.closedAt}`}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onLog(pc.id)} className="px-2 py-1 bg-arbor-green/20 text-arbor-green hover:bg-arbor-green/30 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Log Call</button>
                      <button onClick={() => onEdit(pc)} className="p-1.5 hover:bg-stone-800 text-stone-400"><Edit2 size={13} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ECOSYSTEM_ROLES.map(role => {
                      const captured = eco.filter(e => e.type === role.type);
                      if (captured.length > 0) {
                        return (
                          <div key={role.type} className={`border border-arbor-green/30 bg-arbor-green/5 p-2.5`}>
                            <div className="font-mono text-[9px] uppercase tracking-widest text-arbor-green mb-1.5">✓ {role.label}</div>
                            {captured.map(c => (
                              <button key={c.id} onClick={() => onOpen(c)} className="block w-full text-left mb-1 last:mb-0 group">
                                <div className="text-stone-100 text-sm font-medium group-hover:text-arbor-green transition-colors truncate">{c.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {c.firm && <span className="font-mono text-[10px] text-stone-500 truncate">{c.firm}</span>}
                                  <span className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0 border ${STAGE_COLORS[c.stage]}`}>{c.stage}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <button
                          key={role.type}
                          onClick={() => setCaptureFor({ pastClient: pc, role })}
                          className="border border-dashed border-stone-700 hover:border-arbor-green/60 hover:bg-arbor-green/5 p-2.5 text-left group transition-colors"
                        >
                          <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 group-hover:text-arbor-green mb-1.5">+ Capture {role.label}</div>
                          <div className="text-stone-500 text-sm group-hover:text-stone-300 transition-colors flex items-center gap-1">
                            <Plus size={12} /> Add {role.label.toLowerCase()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {filledRoles.size === ECOSYSTEM_ROLES.length && (
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-arbor-green">◉ Full ecosystem captured · drive each warm intro to Engaged</div>
                  )}
                </div>
              );
            })}
          {past.length === 0 && (
            <div className="bg-stone-900/30 border border-stone-800 px-4 py-12 text-center text-stone-500 text-sm font-mono">
              No past clients in this dashboard yet. Click <span className="text-stone-300">⇣ Pull from EiOS</span> to sync the latest list — past-client contacts of Ryan, Dave, and Taylor.
            </div>
          )}
        </div>
      </div>

      {captureFor && (
        <EcosystemCaptureForm
          pastClient={captureFor.pastClient}
          role={captureFor.role}
          onSave={(contact) => {
            onCaptureEcosystem(captureFor.pastClient, captureFor.role.type, contact);
            setCaptureFor(null);
          }}
          onClose={() => setCaptureFor(null)}
        />
      )}
    </div>
  );
}

function EcosystemCaptureForm({ pastClient, role, onSave, onClose }) {
  const [data, setData] = useState({ name: '', firm: '', phone: '', email: '', linkedinUrl: '', city: '', notes: '' });
  const [error, setError] = useState('');

  const submit = () => {
    if (!data.name.trim()) { setError('Name is required.'); return; }
    onSave(data);
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-lg" labelledBy="ecosystem-capture-title">
      <div className="px-5 sm:px-6 py-4 border-b border-stone-800 flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-arbor-green">Ecosystem Capture · Warm Intro</div>
          <h3 id="ecosystem-capture-title" className="font-display text-xl sm:text-2xl text-stone-100 mt-0.5 truncate">{pastClient.name}'s {role.label}</h3>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-100 shrink-0" aria-label="Close"><X size={20} /></button>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="bg-stone-950 border border-arbor-green/20 px-3 py-2 font-mono text-[11px] text-stone-300 leading-relaxed">
          <span className="text-arbor-green">[layup]</span> Creates a new {role.type} prospect under {pastClient.owner}, sets next action to "Warm intro outreach — reference {pastClient.name}", auto-fires <span className="text-stone-100">prospect.created</span> webhook so EiOS gets the new contact tagged by role.
        </div>
        <Field label="Name" value={data.name} onChange={v => { setData({ ...data, name: v }); if (error) setError(''); }} required error={error && !data.name.trim()} autoFocus />
        <Field label="Firm" value={data.firm} onChange={v => setData({ ...data, firm: v })} placeholder={role.type === 'CPA' ? 'CPA firm or solo practice' : role.type === 'Attorney' ? 'Law firm' : 'Wealth firm or RIA'} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field label="Phone" type="tel" value={data.phone} onChange={v => setData({ ...data, phone: v })} placeholder="(949) 555-0100" />
          <Field label="Email" type="email" value={data.email} onChange={v => setData({ ...data, email: v })} />
        </div>
        <Field label="LinkedIn URL" value={data.linkedinUrl} onChange={v => setData({ ...data, linkedinUrl: v })} placeholder="https://linkedin.com/in/..." />
        <Field label="City" value={data.city} onChange={v => setData({ ...data, city: v })} />
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">Notes from the call</label>
          <textarea
            value={data.notes}
            onChange={e => setData({ ...data, notes: e.target.value })}
            rows={3}
            placeholder={`Anything ${pastClient.name} said about them — long history, complex client, looking for a new lender, etc.`}
            className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-stone-100 text-sm focus:border-arbor-green focus:outline-none"
          />
        </div>
      </div>
      <div className="px-5 sm:px-6 py-4 border-t border-stone-800 flex items-center justify-end gap-3 sticky bottom-0 bg-stone-900">
        <button onClick={onClose} className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-stone-400 hover:text-stone-100">Cancel</button>
        <button onClick={submit} className="bg-arbor-green text-stone-950 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-arbor-green-dark">Capture & Add Prospect</button>
      </div>
    </ModalShell>
  );
}

function ActivityView({ activities, prospects }) {
  const [filterOwner, setFilterOwner] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const filtered = activities.filter(a => {
    if (filterOwner !== 'All' && a.owner !== filterOwner) return false;
    if (filterType !== 'All' && a.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl sm:text-3xl text-stone-100">Activity Log</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 whitespace-nowrap">{filtered.length} entries</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 p-3 bg-stone-900/30 border border-stone-800">
        <Filter size={14} className="text-stone-500 shrink-0" />
        <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="bg-stone-900 border border-stone-700 text-stone-200 px-2 py-1 text-xs font-mono flex-1 sm:flex-initial">
          <option value="All">All Owners</option>
          {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
          <option value="Margaret">Margaret</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-stone-900 border border-stone-700 text-stone-200 px-2 py-1 text-xs font-mono flex-1 sm:flex-initial">
          <option value="All">All Types</option>
          {TOUCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="bg-stone-900/30 border border-stone-800">
        {filtered.map(a => {
          const p = prospects.find(pp => pp.id === a.prospectId);
          return (
            <div key={a.id} className="px-4 py-4 border-b border-stone-800 last:border-0 flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:w-28 sm:shrink-0">
                <div className="font-mono text-[11px] text-stone-500">{a.date}</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-arbor-green">{a.type}</div>
                <div className="font-mono text-[11px] text-stone-400">{a.owner}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-stone-100 font-medium text-sm">{p?.name || 'Unknown'} <span className="text-stone-500 font-normal">· {p?.firm}</span></div>
                <div className="text-stone-300 text-sm mt-1">{a.outcome}</div>
                {a.next && <div className="text-stone-500 text-xs mt-1 italic">Next: {a.next}</div>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-stone-500 text-sm font-mono">No activity matches.</div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, sub, accent = false }) {
  return (
    <div className={`border p-4 ${accent ? 'bg-arbor-green/5 border-arbor-green/30' : 'bg-stone-900/30 border-stone-800'}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-2">{label}</div>
      <div className={`font-display text-4xl ${accent ? 'text-arbor-green' : 'text-stone-100'}`}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-stone-500 mt-1.5">{sub}</div>}
    </div>
  );
}

function ProspectForm({ initial, onSave, onClose, pushToast }) {
  const [data, setData] = useState({
    id: initial?.id || null,
    name: initial?.name || '',
    firm: initial?.firm || '',
    type: initial?.type || 'Financial Advisor',
    stage: initial?.stage || 'Cold',
    owner: initial?.owner || 'Ryan',
    city: initial?.city || '',
    notes: initial?.notes || '',
    lastTouch: initial?.lastTouch || '',
    nextAction: initial?.nextAction || '',
    nextActionDate: initial?.nextActionDate || '',
    eiosId: initial?.eiosId || '',
    eiosSynced: initial?.eiosSynced || false,
    phone: initial?.phone || '',
    email: initial?.email || '',
    linkedinUrl: initial?.linkedinUrl || '',
    websiteUrl: initial?.websiteUrl || '',
    instagramUrl: initial?.instagramUrl || '',
    retrUrl: initial?.retrUrl || '',
    codeUrl: initial?.codeUrl || '',
    codeRequestedAt: initial?.codeRequestedAt || '',
    archived: initial?.archived || false,
    archivedAt: initial?.archivedAt || '',
    closedAt: initial?.closedAt || '',
  });
  const [error, setError] = useState('');

  const submit = () => {
    if (!data.name.trim()) {
      setError('Name is required.');
      pushToast?.('Name is required to save a prospect', 'error');
      return;
    }
    onSave(data);
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl" labelledBy="prospect-form-title">
      <div className="px-5 sm:px-6 py-4 border-b border-stone-800 flex items-center justify-between">
        <h3 id="prospect-form-title" className="font-display text-xl sm:text-2xl text-stone-100">{data.id ? 'Edit Prospect' : 'Add Prospect'}</h3>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-100" aria-label="Close"><X size={20} /></button>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field label="Name" value={data.name} onChange={v => { setData({ ...data, name: v }); if (error) setError(''); }} required error={error && !data.name.trim()} autoFocus />
          <Field label="Firm" value={data.firm} onChange={v => setData({ ...data, firm: v })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <SelectField label="Type" value={data.type} options={TYPES} onChange={v => setData({ ...data, type: v })} />
          <SelectField label="Stage" value={data.stage} options={STAGES} onChange={v => setData({ ...data, stage: v })} />
          <SelectField label="Owner" value={data.owner} options={OWNERS} onChange={v => setData({ ...data, owner: v })} />
        </div>
        <Field label="City" value={data.city} onChange={v => setData({ ...data, city: v })} />
        {data.type === 'Past Client' && (
          <div>
            <Field label="Closed Date (loan funded)" type="date" value={data.closedAt} onChange={v => setData({ ...data, closedAt: v })} />
            <p className="text-[11px] text-stone-500 mt-1.5 font-mono">
              Funding date drives the post-close cadence (Margaret 30d + 90d check-ins, Taylor 45d partner ask). Surfaced on Past Clients view.
            </p>
          </div>
        )}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">Notes</label>
          <textarea
            value={data.notes}
            onChange={e => setData({ ...data, notes: e.target.value })}
            rows={3}
            className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-stone-100 text-sm focus:border-arbor-green focus:outline-none"
          />
        </div>

        {/* Contact */}
        <div className="border-t border-stone-800 pt-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-arbor-green mb-3">Contact</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Phone" type="tel" value={data.phone} onChange={v => setData({ ...data, phone: v })} placeholder="(949) 555-0100" />
            <Field label="Email" type="email" value={data.email} onChange={v => setData({ ...data, email: v })} placeholder="name@firm.com" />
          </div>
          <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <Field label="LinkedIn URL" value={data.linkedinUrl} onChange={v => setData({ ...data, linkedinUrl: v })} placeholder="https://linkedin.com/in/..." />
            <Field label="Website" value={data.websiteUrl} onChange={v => setData({ ...data, websiteUrl: v })} placeholder="https://firm-website.com" />
            <Field label="Instagram URL" value={data.instagramUrl} onChange={v => setData({ ...data, instagramUrl: v })} placeholder="https://instagram.com/handle" />
          </div>
        </div>

        {/* Research */}
        <div className="border-t border-stone-800 pt-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-arbor-green mb-3">Research</div>
          {data.type === 'Realtor' && (
            <div className="mb-4">
              <Field label="RETR Link" value={data.retrUrl} onChange={v => setData({ ...data, retrUrl: v })} placeholder="https://retr.com/agent/..." />
              <p className="text-[11px] text-stone-500 mt-1.5 font-mono">
                Real Estate Transaction Report — paste the URL for this realtor's transaction history page.
              </p>
            </div>
          )}
          <Field label="CODE Dossier URL" value={data.codeUrl} onChange={v => setData({ ...data, codeUrl: v })} placeholder="https://code.arborfg.com/dossier/..." />
          <p className="text-[11px] text-stone-500 mt-1.5 font-mono">
            Paste a CODE research dossier URL if one exists. The "Generate Dossier" button on the detail drawer fires a webhook so the future CODE scraper can build one automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field label="Last Touch" type="date" value={data.lastTouch} onChange={v => setData({ ...data, lastTouch: v })} />
          <Field label="Next Action Date" type="date" value={data.nextActionDate} onChange={v => setData({ ...data, nextActionDate: v })} />
        </div>
        <Field label="Next Action" value={data.nextAction} onChange={v => setData({ ...data, nextAction: v })} placeholder="e.g., Send Partner Preview link" />
        <div className="border-t border-stone-800 pt-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-arbor-green mb-2">EiOS Link</div>
          <Field label="EiOS Contact ID" value={data.eiosId} onChange={v => setData({ ...data, eiosId: v })} placeholder="GUID or contact ID from Dynamics" />
          <p className="text-[11px] text-stone-500 mt-1.5 font-mono">
            The single source of truth lives in EiOS. Link this record to the matching contact so every touch logged here lands on the right contact record.
          </p>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-4 border-t border-stone-800 flex items-center justify-end gap-3 sticky bottom-0 bg-stone-900">
        <button onClick={onClose} className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-stone-400 hover:text-stone-100">Cancel</button>
        <button onClick={submit} className="bg-arbor-green text-stone-950 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-arbor-green-dark">Save</button>
      </div>
    </ModalShell>
  );
}

function ActivityForm({ prospect, defaults, onSave, onClose, pushToast }) {
  const [data, setData] = useState({
    prospectId: prospect.id,
    date: defaults?.date || new Date().toISOString().slice(0, 10),
    type: defaults?.type || 'Call',
    owner: defaults?.owner || prospect.owner || 'Ryan',
    outcome: defaults?.outcome || '',
    next: defaults?.next || '',
  });
  const [error, setError] = useState('');

  const submit = () => {
    if (!data.outcome.trim()) {
      setError('Briefly note the outcome.');
      pushToast?.('Outcome is required', 'error');
      return;
    }
    onSave(data);
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-xl" labelledBy="activity-form-title">
      <div className="px-5 sm:px-6 py-4 border-b border-stone-800 flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-arbor-green">Log Activity</div>
          <h3 id="activity-form-title" className="font-display text-xl sm:text-2xl text-stone-100 mt-0.5 truncate">{prospect.name}</h3>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-100 shrink-0" aria-label="Close"><X size={20} /></button>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Field label="Date" type="date" value={data.date} onChange={v => setData({ ...data, date: v })} />
          <SelectField label="Type" value={data.type} options={TOUCH_TYPES} onChange={v => setData({ ...data, type: v })} />
          <SelectField label="Owner" value={data.owner} options={[...OWNERS, 'Margaret']} onChange={v => setData({ ...data, owner: v })} />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">
            Outcome <span className="text-rose-400 normal-case">*</span>
          </label>
          <textarea
            value={data.outcome}
            autoFocus
            onChange={e => { setData({ ...data, outcome: e.target.value }); if (error) setError(''); }}
            rows={3}
            placeholder="What happened? What did they say?"
            className={`w-full bg-stone-950 border px-3 py-2 text-stone-100 text-sm focus:outline-none ${error && !data.outcome.trim() ? 'border-rose-500/60 focus:border-rose-400' : 'border-stone-700 focus:border-arbor-green'}`}
          />
          {error && !data.outcome.trim() && <div className="font-mono text-[11px] text-rose-400 mt-1">{error}</div>}
        </div>
        <Field label="Next Action" value={data.next} onChange={v => setData({ ...data, next: v })} placeholder="What's the next move?" />
        <div className="bg-stone-950 border border-stone-800 px-3 py-2 font-mono text-[10px] text-stone-500">
          <span className="text-arbor-green">[auto]</span> Logging a Zoom or In-Person will advance the prospect to <span className="text-stone-300">Meeting Booked</span>.
        </div>
      </div>
      <div className="px-5 sm:px-6 py-4 border-t border-stone-800 flex items-center justify-end gap-3 sticky bottom-0 bg-stone-900">
        <button onClick={onClose} className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-stone-400 hover:text-stone-100">Cancel</button>
        <button onClick={submit} className="bg-arbor-green text-stone-950 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-arbor-green-dark">Log It</button>
      </div>
    </ModalShell>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required, error, autoFocus }) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">
        {label}{required && <span className="text-rose-400 normal-case ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-stone-950 border px-3 py-2 text-stone-100 text-sm focus:outline-none ${error ? 'border-rose-500/60 focus:border-rose-400' : 'border-stone-700 focus:border-arbor-green'}`}
      />
      {error && <div className="font-mono text-[11px] text-rose-400 mt-1">{typeof error === 'string' ? error : `${label} is required.`}</div>}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  // Options can be ['a', 'b'] or [{ value, label }]
  const normalized = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-stone-100 text-sm focus:border-arbor-green focus:outline-none"
      >
        {normalized.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Shared modal wrapper: backdrop click closes, Esc handled at app level.
function ModalShell({ children, onClose, maxWidth = 'max-w-xl', labelledBy }) {
  return (
    <div
      className="fixed inset-0 bg-stone-950/80 backdrop-blur z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-[fadeIn_120ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-stone-900 border border-stone-800 w-full ${maxWidth} max-h-[95vh] sm:max-h-[90vh] overflow-auto shadow-2xl shadow-black/40`}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS — EiOS sync configuration & data management
// ============================================================================

function SettingsView({ config, onChange, prospects, activities }) {
  const [local, setLocal] = useState(config);
  const [testStatus, setTestStatus] = useState('');

  useEffect(() => { setLocal(config); }, [config]);

  const save = () => {
    onChange(local);
    setTestStatus('Settings saved.');
    setTimeout(() => setTestStatus(''), 2000);
  };

  const testWebhook = async () => {
    if (!local.webhookUrl) { setTestStatus('Add a webhook URL first.'); return; }
    setTestStatus('Sending ping (no-cors mode — browser cannot read the response)...');
    try {
      await fetch(local.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test.ping',
          source: 'aepc-command-center',
          timestamp: new Date().toISOString(),
          message: 'Test ping from the AEPC Command Center'
        })
      });
      setTestStatus('Request sent — check Power Automate / Zapier run history to confirm receipt. (no-cors hides the response, so this is not a delivery confirmation.)');
    } catch (e) {
      setTestStatus('Network error: ' + e.message);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ prospects, activities }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aepc-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Firm', 'Type', 'Stage', 'Owner', 'City', 'Last Touch', 'Next Action', 'Next Action Date', 'EiOS Contact ID', 'Notes'];
    const rows = prospects.map(p => [p.name, p.firm, p.type, p.stage, p.owner, p.city || '', p.lastTouch || '', p.nextAction || '', p.nextActionDate || '', p.eiosId || '', (p.notes || '').replace(/\n/g, ' ')]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aepc-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-arbor-green uppercase">Configuration</div>
        <h2 className="font-display text-2xl sm:text-3xl text-stone-100 mt-1">Settings</h2>
      </div>

      {/* Keyboard shortcut reference */}
      <section className="bg-stone-900/30 border border-stone-800 p-5 sm:p-6">
        <h3 className="font-display text-xl text-stone-100 mb-2">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
          <div className="flex items-center justify-between gap-4 border-b border-stone-800/60 pb-1.5"><span className="text-stone-400">Add prospect</span><kbd className="font-mono text-[10px] text-stone-200 bg-stone-950 border border-stone-700 px-1.5 py-0.5">⌘ / Ctrl + K</kbd></div>
          <div className="flex items-center justify-between gap-4 border-b border-stone-800/60 pb-1.5"><span className="text-stone-400">New prospect (also)</span><kbd className="font-mono text-[10px] text-stone-200 bg-stone-950 border border-stone-700 px-1.5 py-0.5">N</kbd></div>
          <div className="flex items-center justify-between gap-4 border-b border-stone-800/60 pb-1.5"><span className="text-stone-400">Search prospects</span><kbd className="font-mono text-[10px] text-stone-200 bg-stone-950 border border-stone-700 px-1.5 py-0.5">/</kbd></div>
          <div className="flex items-center justify-between gap-4 border-b border-stone-800/60 pb-1.5"><span className="text-stone-400">Close modal / drawer</span><kbd className="font-mono text-[10px] text-stone-200 bg-stone-950 border border-stone-700 px-1.5 py-0.5">Esc</kbd></div>
        </div>
      </section>

      {/* EiOS Integration */}
      <section className="bg-stone-900/30 border border-stone-800 p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="font-display text-xl text-stone-100">EiOS Integration</h3>
          <p className="text-sm text-stone-400 mt-1 leading-relaxed">
            Every contact and activity logged here belongs in EiOS — the single source of truth lives in Dynamics, not in this dashboard.
            Three integration paths in order of effort. Start with webhook sync, move to direct API once the workflow is proven.
          </p>
        </div>

        {/* Path explainer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-stone-950 border border-stone-800 p-3">
            <div className="font-mono text-[10px] text-arbor-green uppercase tracking-wider mb-1">Path C · Now</div>
            <div className="font-display text-stone-100 text-base mb-1">Webhook</div>
            <div className="text-stone-400 leading-relaxed">One-way push. Every action here fires a webhook → Power Automate or Zapier writes a Note on the matching EiOS contact. ~1 day to wire.</div>
          </div>
          <div className="bg-stone-950 border border-stone-800 p-3">
            <div className="font-mono text-[10px] text-amber-400 uppercase tracking-wider mb-1">Path B · Soon</div>
            <div className="font-display text-stone-100 text-base mb-1">Power Automate</div>
            <div className="text-stone-400 leading-relaxed">Structured. SharePoint List middleware that Power Automate watches. ~3 days. No code on Arbor's side.</div>
          </div>
          <div className="bg-stone-950 border border-stone-800 p-3">
            <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mb-1">Path A · Later</div>
            <div className="font-display text-stone-100 text-base mb-1">Dynamics API</div>
            <div className="text-stone-400 leading-relaxed">Two-way sync. Real source of truth alignment. ~1–2 wks. Needs service principal + EiOS dev time.</div>
          </div>
        </div>

        {/* Config fields */}
        <div className="space-y-4 pt-2">
          <Field
            label="EiOS Contact Base URL"
            value={local.baseUrl}
            onChange={v => setLocal({ ...local, baseUrl: v })}
            placeholder="https://eios.arborfg.com/main.aspx?etn=contact&id="
          />
          <p className="text-[11px] text-stone-500 -mt-3 font-mono">
            The URL prefix for opening a contact in EiOS. The contact ID gets appended to this. Click any contact in EiOS, copy the URL up to and including <span className="text-stone-300">id=</span>.
          </p>

          <Field
            label="Webhook URL (Power Automate or Zapier)"
            value={local.webhookUrl}
            onChange={v => setLocal({ ...local, webhookUrl: v })}
            placeholder="https://prod-XX.westus.logic.azure.com/workflows/..."
          />
          <p className="text-[11px] text-stone-500 -mt-3 font-mono">
            Every prospect created/updated and every activity logged will POST to this URL with a JSON payload.
          </p>

          <label className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              checked={local.enabled}
              onChange={e => setLocal({ ...local, enabled: e.target.checked })}
              className="w-4 h-4 accent-arbor-green"
            />
            <span className="text-sm text-stone-200">Enable webhook sync to EiOS</span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={save} className="bg-arbor-green text-stone-950 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-arbor-green-dark">Save Settings</button>
          <button onClick={testWebhook} className="bg-stone-800 text-stone-200 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-stone-700">Test Webhook</button>
        </div>
        {testStatus && <div className="font-mono text-[11px] text-stone-300 leading-relaxed">{testStatus}</div>}
      </section>

      {/* Webhook payload reference */}
      <section className="bg-stone-900/30 border border-stone-800 p-5 sm:p-6">
        <h3 className="font-display text-xl text-stone-100 mb-2">Payload Reference</h3>
        <p className="text-sm text-stone-400 mb-4">
          Hand this to whoever builds the Power Automate flow. These are the events the dashboard fires.
        </p>
        <div className="bg-stone-950 border border-stone-800 p-4 font-mono text-[11px] text-stone-300 leading-relaxed overflow-x-auto">
          <div className="text-arbor-green">// activity.logged</div>
          <pre className="text-stone-300 mt-1">{`{
  "event": "activity.logged",
  "source": "aepc-command-center",
  "timestamp": "2026-05-05T18:00:00Z",
  "activity": {
    "id": "a1234567890",
    "prospectId": "p1234567890",
    "date": "2026-05-05",
    "type": "Zoom",
    "owner": "Ryan",
    "outcome": "Discussed AEPC partnership. Strong fit.",
    "next": "Send Partner Preview deck"
  },
  "prospect": {
    "name": "Mark Henderson",
    "firm": "Henderson Wealth",
    "eiosId": "<contact GUID>",
    "stage": "Meeting Booked",
    "owner": "Ryan"
  }
}`}</pre>
          <div className="text-arbor-green mt-3">// prospect.created and prospect.updated</div>
          <pre className="text-stone-300 mt-1">{`{
  "event": "prospect.created",
  "source": "aepc-command-center",
  "timestamp": "2026-05-05T18:00:00Z",
  "prospect": { /* full prospect record */ }
}`}</pre>
          <div className="text-arbor-green mt-3">// lead.created / lead.updated / lead.deleted</div>
          <pre className="text-stone-300 mt-1">{`{
  "event": "lead.created",
  "source": "aepc-command-center",
  "timestamp": "2026-05-06T18:00:00Z",
  "lead": {
    "id": "l...",
    "prospectId": "p...",       // referring prospect
    "name": "Borrower / lead name",
    "status": "Open",            // Open | Funded | Lost
    "loanAmount": 850000,
    "revenue": 12500,
    "fundedDate": "2026-04-15"
  },
  "prospect": { /* the source prospect record */ }
}`}</pre>
          <div className="text-arbor-green mt-3">// event.created / event.updated / event.deleted (Calendar)</div>
          <pre className="text-stone-300 mt-1">{`{
  "event": "event.created",
  "source": "aepc-command-center",
  "timestamp": "2026-05-06T18:00:00Z",
  "event": {
    "id": "ev...",
    "type": "Open House Hosted",
    "date": "2026-05-10",
    "location": "...",
    "host": "Taylor",
    "prospectIds": ["p1", "p3"],
    "notes": "..."
  }
}`}</pre>
          <div className="text-arbor-green mt-3">// prospect.archived and prospect.unarchived</div>
          <pre className="text-stone-300 mt-1">{`{
  "event": "prospect.archived",
  "source": "aepc-command-center",
  "timestamp": "2026-05-06T18:00:00Z",
  "prospect": {
    "archived": true,
    "archivedAt": "2026-05-06T18:00:00Z",
    /* full prospect record */
  }
}`}</pre>
          <div className="text-arbor-green mt-3">// prospect.codeRequested — fires when an operator clicks "Generate Dossier"</div>
          <pre className="text-stone-300 mt-1">{`{
  "event": "prospect.codeRequested",
  "source": "aepc-command-center",
  "timestamp": "2026-05-06T18:00:00Z",
  "prospect": {
    "id": "p1234567890",
    "name": "Sari Ward",
    "firm": "Compass Laguna Niguel",
    "type": "Realtor",
    "linkedinUrl": "...",
    "websiteUrl": "...",
    "phone": "...",
    "email": "...",
    /* full prospect record */
  }
}`}</pre>
        </div>
        <p className="text-[11px] text-stone-500 mt-3 font-mono leading-relaxed">
          The Power Automate flow should: (1) match <span className="text-stone-300">eiosId</span> to a Dynamics contact, (2) create a Note or Activity record on that contact with the outcome and next-action text, (3) optionally update a custom <span className="text-stone-300">aepc_stage</span> field on the contact.
        </p>
        <p className="text-[11px] text-stone-500 mt-2 font-mono leading-relaxed">
          The CODE scraper service should listen for <span className="text-stone-300">prospect.codeRequested</span>, build a dossier from the prospect's contact info + social links, then write the dossier URL back to this dashboard via <span className="text-stone-300">POST /api/data</span> with key <span className="text-stone-300">aepc:prospects</span>.
        </p>
      </section>

      {/* Data export */}
      <section className="bg-stone-900/30 border border-stone-800 p-5 sm:p-6">
        <h3 className="font-display text-xl text-stone-100 mb-2">Export Data</h3>
        <p className="text-sm text-stone-400 mb-4">
          Snapshot today's data for backup or to bulk-import into EiOS.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={exportCSV} className="bg-stone-800 text-stone-200 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-stone-700 flex items-center gap-2">
            <Download size={13} /> Prospects (CSV)
          </button>
          <button onClick={exportJSON} className="bg-stone-800 text-stone-200 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-stone-700 flex items-center gap-2">
            <Download size={13} /> All Data (JSON)
          </button>
        </div>
      </section>

      {/* Team roster */}
      <section className="bg-stone-900/30 border border-stone-800 p-5 sm:p-6">
        <h3 className="font-display text-xl text-stone-100 mb-2">Operating Team</h3>
        <p className="text-sm text-stone-400 mb-4">
          The four operators who carry pipeline. Hannah supports as needed but is not an operator on this channel.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: 'Ryan', role: 'CEO · Top-of-funnel + strategic Zoom closes' },
            { name: 'Dave', role: 'Chief Lending Strategist · Scenario-driven Zooms' },
            { name: 'Taylor', role: 'Production Manager · Pipeline velocity + daily steward' },
            { name: 'Jessica', role: 'Event Coordinator · Social outreach + DM sequence' },
          ].map(p => (
            <div key={p.name} className="bg-stone-950 border border-stone-800 p-3">
              <div className="font-display text-lg text-stone-100">{p.name}</div>
              <div className="text-[11px] text-stone-400 mt-1 leading-relaxed">{p.role}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// DATA-VIZ — Sparkline + Pipeline Funnel
// ============================================================================

function Sparkline({ data, goal }) {
  const w = 180;
  const h = 56;
  const pad = 4;
  if (!data?.length) return null;
  const max = Math.max(goal || 0, ...data.map(d => d.count), 1);
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const yFor = (v) => h - pad - (v / max) * (h - pad * 2);
  const points = data.map((d, i) => `${pad + i * stepX},${yFor(d.count)}`);
  const path = `M ${points.join(' L ')}`;
  const area = `${path} L ${pad + (data.length - 1) * stepX},${h - pad} L ${pad},${h - pad} Z`;
  const goalY = goal ? yFor(goal) : null;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block" aria-label="Last 6 months meeting trend">
      {goalY !== null && (
        <line x1={pad} y1={goalY} x2={w - pad} y2={goalY} stroke="#7CC142" strokeOpacity="0.25" strokeDasharray="2 3" />
      )}
      <path d={area} fill="#7CC142" fillOpacity="0.10" />
      <path d={path} fill="none" stroke="#7CC142" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const cx = pad + i * stepX;
        const cy = yFor(d.count);
        const isLast = i === data.length - 1;
        return (
          <g key={d.key}>
            <circle cx={cx} cy={cy} r={isLast ? 2.5 : 1.5} fill={isLast ? '#7CC142' : '#7CC142'} fillOpacity={isLast ? 1 : 0.5} />
            <title>{`${d.label}: ${d.count}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function PipelineFunnel({ stageCounts, onStageClick }) {
  const total = Object.values(stageCounts).reduce((s, n) => s + n, 0);
  const max = Math.max(1, ...Object.values(stageCounts));
  return (
    <div className="space-y-2">
      {STAGES.map(stage => {
        const n = stageCounts[stage] || 0;
        const pct = (n / max) * 100;
        const sharePct = total ? (n / total) * 100 : 0;
        return (
          <button
            key={stage}
            onClick={onStageClick}
            className="w-full text-left flex items-center gap-3 sm:gap-4 group"
          >
            <div className="w-28 sm:w-36 shrink-0 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-400 group-hover:text-stone-100 transition-colors">
              {stage}
            </div>
            <div className="flex-1 h-7 sm:h-8 bg-stone-900/50 border border-stone-800 relative overflow-hidden group-hover:border-arbor-green/40 transition-colors">
              <div
                className={`h-full ${STAGE_COLORS[stage].split(' ')[0]} group-hover:opacity-90 transition-all`}
                style={{ width: `${Math.max(pct, n > 0 ? 4 : 0)}%` }}
              />
              <div className="absolute inset-0 flex items-center px-2 sm:px-3 justify-between">
                <span className={`font-display text-base sm:text-lg ${n > 0 ? 'text-stone-100' : 'text-stone-600'}`}>{n}</span>
                {total > 0 && n > 0 && (
                  <span className="font-mono text-[10px] text-stone-400">{Math.round(sharePct)}%</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SCOREBOARD TILE — secondary metrics under the Meetings hero
// ============================================================================

function ScoreboardTile({ label, value, delta, deltaIsCurrency, sub, accent }) {
  const hasDelta = delta !== undefined && delta !== null && delta !== 0;
  const positive = delta > 0;
  return (
    <div className={`border p-4 ${accent ? 'border-arbor-green/30 bg-arbor-green/5' : 'border-stone-800 bg-stone-900/40'}`}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-2">{label}</div>
      <div className="flex items-baseline gap-3">
        <span className={`font-display text-3xl sm:text-4xl ${accent ? 'text-arbor-green' : 'text-stone-100'}`}>{value}</span>
        {hasDelta && (
          <span className={`font-mono text-[10px] uppercase tracking-wider ${positive ? 'text-arbor-green' : 'text-rose-400'}`}>
            {positive ? '▲' : '▼'} {deltaIsCurrency ? formatCurrency(Math.abs(delta)) : Math.abs(delta)}
          </span>
        )}
      </div>
      {sub && <div className="font-mono text-[10px] text-stone-500 mt-1.5">{sub}</div>}
    </div>
  );
}

// ============================================================================
// WEEKLY CADENCE — recurring team rhythm reminders (Tuesday Pipeline Call etc.)
// ============================================================================

const WEEKLY_TASKS = [
  {
    id: 'tue-pipeline',
    label: 'Tuesday Pipeline Call',
    sub: 'Active deals review with the team',
    dayOfWeek: 2, // Sun=0, Mon=1, Tue=2…
    owner: 'Taylor',
  },
];

function nextOccurrence(dayOfWeek) {
  const today = new Date();
  const cur = today.getDay();
  let delta = (dayOfWeek - cur + 7) % 7;
  if (delta === 0) return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + delta);
  return d;
}

function formatDayLabel(d) {
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return 'Today';
  return d.toLocaleString('en', { weekday: 'long', month: 'short', day: 'numeric' });
}

function WeeklyCadence({ onOpenPipeline }) {
  const today = new Date();
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl text-stone-100">This Week's Cadence</h2>
          <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">Recurring team rhythms · the standing meetings that move pipeline</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {WEEKLY_TASKS.map(task => {
          const next = nextOccurrence(task.dayOfWeek);
          const isToday = today.toDateString() === next.toDateString();
          const dayLabel = formatDayLabel(next);
          return (
            <div
              key={task.id}
              className={`border p-4 ${isToday ? 'bg-arbor-green/10 border-arbor-green/50' : 'bg-stone-900/40 border-stone-800'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className={`font-mono text-[10px] uppercase tracking-widest ${isToday ? 'text-arbor-green' : 'text-stone-500'}`}>
                    {isToday ? '◉ ' : ''}{dayLabel}
                  </div>
                  <div className="font-display text-xl text-stone-100 mt-1 leading-tight">{task.label}</div>
                  <div className="text-sm text-stone-400 mt-0.5">{task.sub}</div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 shrink-0">{task.owner}</span>
              </div>
              <button
                onClick={onOpenPipeline}
                className={`w-full px-3 py-2 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${
                  isToday
                    ? 'bg-arbor-green text-stone-950 hover:bg-arbor-green-dark'
                    : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                }`}
              >
                Open Active Pipeline <ArrowRight size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// STALE WATCH — replaces "Who's Carrying What"
// Lists prospects nobody has touched in STALE_DAYS+, grouped by owner.
// Actionable: each row has a Log Touch button + clickable name.
// ============================================================================

function StaleWatch({ prospects, onOpen, onLog }) {
  const stale = prospects
    .filter(p => p.stage !== 'Cold' && p.stage !== 'Activated Partner')
    .map(p => ({ p, days: daysSince(p.lastTouch) }))
    .filter(({ days }) => days === null || days >= STALE_DAYS)
    .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999));

  const byOwner = OWNERS.reduce((acc, o) => {
    acc[o] = stale.filter(({ p }) => p.owner === o);
    return acc;
  }, {});

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl text-stone-100">Stale Watch</h2>
          <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-0.5">Active prospects untouched {STALE_DAYS}+ days, by owner</div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{stale.length} need attention</span>
      </div>
      {stale.length === 0 ? (
        <div className="bg-stone-900/30 border border-stone-800 px-4 py-8 text-center text-arbor-green font-mono text-sm">
          ◉ All active prospects touched in the last {STALE_DAYS} days. Solid.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {OWNERS.filter(o => byOwner[o].length > 0).map(owner => (
            <div key={owner} className="bg-stone-900/30 border border-stone-800">
              <div className="px-3 py-2 border-b border-stone-800 flex items-center justify-between">
                <span className="font-display text-lg text-stone-100">{owner}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300">{byOwner[owner].length} stale</span>
              </div>
              <div className="divide-y divide-stone-800">
                {byOwner[owner].map(({ p, days }) => (
                  <div key={p.id} className="px-3 py-2.5 flex items-center gap-2.5 text-sm">
                    <button onClick={() => onOpen(p)} className="flex-1 text-left min-w-0 group">
                      <div className="text-stone-100 group-hover:text-arbor-green transition-colors truncate font-medium">{p.name}</div>
                      <div className="text-[11px] text-stone-500 truncate">{p.firm} · {p.stage}</div>
                    </button>
                    <span className={`font-mono text-[11px] ${days === null ? 'text-rose-400' : days >= 30 ? 'text-rose-400' : 'text-amber-300'} shrink-0`}>
                      {days === null ? 'never' : `${days}d`}
                    </span>
                    <button onClick={() => onLog(p.id)} className="px-2 py-0.5 bg-arbor-green/20 text-arbor-green hover:bg-arbor-green/30 font-mono text-[10px] uppercase tracking-wider shrink-0">Log</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// TOP SOURCES BY REVENUE
// Aggregates funded leads per prospect, ranks by revenue.
// ============================================================================

function TopSourcesByRevenue({ prospects, leads, onOpen }) {
  const summary = useMemo(() => {
    const byProspect = {};
    leads.forEach(l => {
      const id = l.prospectId;
      if (!byProspect[id]) byProspect[id] = { prospectId: id, leads: 0, funded: 0, volume: 0, revenue: 0 };
      byProspect[id].leads += 1;
      if (l.status === 'Funded') {
        byProspect[id].funded += 1;
        byProspect[id].volume += Number(l.loanAmount) || 0;
        byProspect[id].revenue += Number(l.revenue) || 0;
      }
    });
    return Object.values(byProspect)
      .map(s => ({ ...s, prospect: prospects.find(p => p.id === s.prospectId) }))
      .filter(s => s.prospect)
      .sort((a, b) => b.revenue - a.revenue);
  }, [leads, prospects]);

  const totals = useMemo(() => leads.reduce((acc, l) => {
    if (l.status === 'Funded') {
      acc.funded += 1;
      acc.volume += Number(l.loanAmount) || 0;
      acc.revenue += Number(l.revenue) || 0;
    }
    if (l.status === 'Open') acc.openCount += 1;
    if (l.status === 'Open') acc.openVolume += Number(l.loanAmount) || 0;
    return acc;
  }, { funded: 0, volume: 0, revenue: 0, openCount: 0, openVolume: 0 }), [leads]);

  if (leads.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-stone-100">Top Partners by Revenue</h2>
        </div>
        <div className="bg-stone-900/30 border border-stone-800 px-4 py-8 text-center text-stone-500 font-mono text-sm">
          No leads logged yet. Open a partner → "Add Lead" to start tracking the value of each relationship.
        </div>
      </section>
    );
  }

  const topRev = Math.max(1, ...summary.map(s => s.revenue));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-stone-100">Top Partners by Revenue</h2>
        <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 flex flex-wrap gap-x-4 gap-y-0.5 justify-end">
          <span>Funded: <span className="text-arbor-green">{formatCurrency(totals.revenue)}</span> · {formatCurrency(totals.volume)} vol · {totals.funded} loans</span>
          <span>Open: <span className="text-amber-300">{totals.openCount}</span> · {formatCurrency(totals.openVolume)} pipeline</span>
        </div>
      </div>
      <div className="bg-stone-900/30 border border-stone-800 divide-y divide-stone-800">
        {summary.slice(0, 8).map(s => (
          <button key={s.prospectId} onClick={() => onOpen(s.prospect)} className="w-full px-4 py-3 flex items-center gap-3 text-sm text-left hover:bg-stone-900/50 group transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-stone-100 font-medium group-hover:text-arbor-green transition-colors truncate">{s.prospect.name}</span>
                <span className={`font-mono text-[10px] ${TYPE_COLORS[s.prospect.type]}`}>{s.prospect.type.split(' ')[0]}</span>
              </div>
              <div className="text-[11px] text-stone-500 truncate">{s.prospect.firm}</div>
              <div className="mt-1.5 h-1 bg-stone-800 overflow-hidden">
                <div className="h-full bg-arbor-green/60" style={{ width: `${(s.revenue / topRev) * 100}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0 font-mono text-[11px]">
              <div className="text-arbor-green text-sm">{formatCurrency(s.revenue)}</div>
              <div className="text-stone-500">{s.funded}/{s.leads} funded · {formatCurrency(s.volume)}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// LEADS VIEW — top-level tab
// ============================================================================

function LeadsView({ leads, prospects, onAdd, onEdit, onDelete, onOpen }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [partnerFilter, setPartnerFilter] = useState('All');

  const filtered = leads.filter(l => {
    if (statusFilter !== 'All' && l.status !== statusFilter) return false;
    if (partnerFilter !== 'All' && l.prospectId !== partnerFilter) return false;
    return true;
  });

  const totals = useMemo(() => filtered.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    if (l.status === 'Funded') {
      acc.volume += Number(l.loanAmount) || 0;
      acc.revenue += Number(l.revenue) || 0;
    }
    if (l.status === 'Open') {
      acc.openVolume += Number(l.loanAmount) || 0;
    }
    return acc;
  }, { Open: 0, Funded: 0, Lost: 0, volume: 0, revenue: 0, openVolume: 0 }), [filtered]);

  // Sort partners (activated prospects) first in the filter dropdown, then the rest.
  const partnerOptions = useMemo(() => {
    const partners = prospects.filter(p => p.stage === 'Activated Partner').sort((a, b) => a.name.localeCompare(b.name));
    const others = prospects.filter(p => p.stage !== 'Activated Partner').sort((a, b) => a.name.localeCompare(b.name));
    return [...partners, ...others];
  }, [prospects]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-stone-100">Leads</h2>
          <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-1">Borrowers referred by AEPC partners — value side of every relationship</div>
        </div>
        <button onClick={onAdd} className="bg-arbor-green text-stone-950 px-3 sm:px-4 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-arbor-green-dark whitespace-nowrap">
          <Plus size={14} /> <span className="hidden sm:inline">Log Lead</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPI label="Open Leads" value={totals.Open} sub={`${formatCurrency(totals.openVolume)} pipeline`} />
        <KPI label="Funded" value={totals.Funded} sub={`${formatCurrency(totals.volume)} volume`} accent />
        <KPI label="Revenue" value={formatCurrency(totals.revenue)} sub="Funded leads" accent />
        <KPI label="Conversion" value={`${totals.Funded + totals.Lost > 0 ? Math.round(100 * totals.Funded / (totals.Funded + totals.Lost)) : 0}%`} sub="Funded ÷ resolved" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-stone-900/30 border border-stone-800">
        <Filter size={14} className="text-stone-500 shrink-0" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-stone-900 border border-stone-700 text-stone-200 px-2 py-1 text-xs font-mono">
          <option value="All">All Statuses</option>
          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)} className="bg-stone-900 border border-stone-700 text-stone-200 px-2 py-1 text-xs font-mono flex-1 sm:flex-initial truncate">
          <option value="All">All Partners</option>
          {partnerOptions.map(p => <option key={p.id} value={p.id}>{p.name}{p.stage !== 'Activated Partner' ? ` · ${p.stage}` : ''}</option>)}
        </select>
      </div>

      <div className="bg-stone-900/30 border border-stone-800">
        {/* Header row (desktop) */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 border-b border-stone-800 font-mono text-[10px] uppercase tracking-wider text-stone-500">
          <div className="col-span-1">Status</div>
          <div className="col-span-3">Lead</div>
          <div className="col-span-3">Partner</div>
          <div className="col-span-2 text-right">Loan Amount</div>
          <div className="col-span-1 text-right">Revenue</div>
          <div className="col-span-1 text-right">Funded</div>
          <div className="col-span-1 text-right">·</div>
        </div>
        <div className="divide-y divide-stone-800">
          {filtered.map(l => {
            const partner = prospects.find(p => p.id === l.prospectId);
            return (
              <div key={l.id} className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center gap-2 text-sm">
                <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border self-start sm:col-span-1 sm:justify-self-start ${LEAD_STATUS_COLORS[l.status]}`}>{l.status}</span>
                <button onClick={() => onEdit(l)} className="text-left text-stone-100 hover:text-arbor-green transition-colors min-w-0 sm:col-span-3 sm:truncate font-medium">
                  {l.name}
                </button>
                <button onClick={() => partner && onOpen(partner)} className="text-left min-w-0 sm:col-span-3 group">
                  {partner ? (
                    <>
                      <div className="text-stone-300 text-xs sm:text-sm group-hover:text-arbor-green transition-colors truncate">{partner.name}</div>
                      <div className="font-mono text-[10px] text-stone-500 truncate">{partner.firm} · {partner.type}</div>
                    </>
                  ) : (
                    <span className="text-xs text-stone-600 italic">unknown</span>
                  )}
                </button>
                <span className="font-mono text-[11px] text-stone-300 sm:col-span-2 sm:text-right">{formatCurrency(l.loanAmount)}</span>
                <span className="font-mono text-[11px] text-arbor-green sm:col-span-1 sm:text-right">{l.status === 'Funded' ? formatCurrency(l.revenue) : <span className="text-stone-600">—</span>}</span>
                <span className="font-mono text-[10px] text-stone-500 sm:col-span-1 sm:text-right">{l.fundedDate || <span className="text-stone-700">—</span>}</span>
                <div className="self-end sm:self-auto sm:col-span-1 sm:text-right">
                  <button onClick={() => onDelete(l.id)} className="p-1.5 text-stone-500 hover:text-rose-400 inline-flex" title="Delete lead"><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-stone-500 text-sm font-mono">No leads match.</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PARTNERS VIEW — activated prospects + their loan production scoreboard
// ============================================================================

function PartnersView({ prospects, leads, onOpen, onAddLead }) {
  const partners = useMemo(() => {
    const partners = prospects.filter(p => p.stage === 'Activated Partner');
    return partners.map(p => {
      const pLeads = leads.filter(l => l.prospectId === p.id);
      const open = pLeads.filter(l => l.status === 'Open');
      const funded = pLeads.filter(l => l.status === 'Funded');
      const lost = pLeads.filter(l => l.status === 'Lost');
      const volume = funded.reduce((s, l) => s + (Number(l.loanAmount) || 0), 0);
      const revenue = funded.reduce((s, l) => s + (Number(l.revenue) || 0), 0);
      const openVolume = open.reduce((s, l) => s + (Number(l.loanAmount) || 0), 0);
      const lastFunded = funded.map(l => l.fundedDate).filter(Boolean).sort().slice(-1)[0] || '';
      return { p, leads: pLeads.length, open: open.length, funded: funded.length, lost: lost.length, volume, revenue, openVolume, lastFunded };
    }).sort((a, b) => b.revenue - a.revenue || b.volume - a.volume);
  }, [prospects, leads]);

  const totals = useMemo(() => partners.reduce((acc, x) => {
    acc.partners += 1;
    acc.leads += x.leads;
    acc.funded += x.funded;
    acc.volume += x.volume;
    acc.revenue += x.revenue;
    acc.openVolume += x.openVolume;
    return acc;
  }, { partners: 0, leads: 0, funded: 0, volume: 0, revenue: 0, openVolume: 0 }), [partners]);

  const topRev = Math.max(1, ...partners.map(x => x.revenue));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-stone-100">Partners</h2>
        <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-1">
          Prospects who've activated · the people producing loans for the channel
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPI label="Active Partners" value={totals.partners} sub="Activated stage" accent={totals.partners > 0} />
        <KPI label="Volume Funded" value={formatCurrency(totals.volume)} sub={`${totals.funded} loans`} accent={totals.funded > 0} />
        <KPI label="Revenue" value={formatCurrency(totals.revenue)} sub="From AEPC partners" accent={totals.revenue > 0} />
        <KPI label="Open Pipeline" value={formatCurrency(totals.openVolume)} sub={`${totals.leads - totals.funded} leads in flight`} />
      </div>

      {/* Desktop table */}
      <div className="bg-stone-900/30 border border-stone-800 hidden md:block">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-stone-800 font-mono text-[10px] uppercase tracking-wider text-stone-500">
          <div className="col-span-3">Partner</div>
          <div className="col-span-2">Type · Owner</div>
          <div className="col-span-2 text-right">Volume Funded</div>
          <div className="col-span-2 text-right">Revenue</div>
          <div className="col-span-1 text-right">Loans</div>
          <div className="col-span-2 text-right">Last Funded</div>
        </div>
        {partners.map(({ p, leads: leadCt, open, funded, volume, revenue, openVolume, lastFunded }) => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="w-full grid grid-cols-12 gap-3 px-4 py-3 border-b border-stone-800 last:border-0 items-center text-sm text-left hover:bg-stone-900/40 group transition-colors"
          >
            <div className="col-span-3 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-100 group-hover:text-arbor-green transition-colors truncate">{p.name}</span>
                <ContactBadges prospect={p} />
              </div>
              <div className="text-xs text-stone-500 truncate">{p.firm}</div>
              <div className="mt-1.5 h-1 bg-stone-800 overflow-hidden max-w-[180px]">
                <div className="h-full bg-arbor-green/60" style={{ width: `${(revenue / topRev) * 100}%` }} />
              </div>
            </div>
            <div className="col-span-2 min-w-0">
              <span className={`font-mono text-[11px] ${TYPE_COLORS[p.type]}`}>{p.type}</span>
              <div className="font-mono text-[10px] text-stone-500">{p.owner}</div>
            </div>
            <div className="col-span-2 text-right font-mono text-[11px] text-stone-200">
              {formatCurrency(volume)}
              {openVolume > 0 && <div className="text-amber-300 text-[10px]">+{formatCurrency(openVolume)} open</div>}
            </div>
            <div className="col-span-2 text-right font-mono text-[11px] text-arbor-green">{formatCurrency(revenue)}</div>
            <div className="col-span-1 text-right font-mono text-[11px] text-stone-300">
              {funded}/{leadCt}
              {open > 0 && <div className="text-amber-300 text-[10px]">{open} open</div>}
            </div>
            <div className="col-span-2 text-right font-mono text-[11px] text-stone-500">
              {lastFunded || <span className="italic">—</span>}
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onAddLead(p.id); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onAddLead(p.id); } }}
                className="inline-block mt-1 text-arbor-green hover:text-arbor-green-dark cursor-pointer normal-case font-mono text-[10px] uppercase tracking-wider"
              >
                + Lead
              </div>
            </div>
          </button>
        ))}
        {partners.length === 0 && (
          <div className="px-4 py-12 text-center text-stone-500 text-sm font-mono">
            No partners activated yet. Move a prospect to "Activated Partner" stage to populate this list.
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {partners.map(({ p, leads: leadCt, open, funded, volume, revenue, lastFunded }) => (
          <button key={p.id} onClick={() => onOpen(p)} className="w-full bg-stone-900/30 border border-stone-800 p-3 text-left hover:border-arbor-green/40 transition-colors block">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-100 truncate">{p.name}</span>
                  <ContactBadges prospect={p} />
                </div>
                <div className="text-xs text-stone-500 truncate">{p.firm}</div>
              </div>
              <span className={`font-mono text-[9px] ${TYPE_COLORS[p.type]} shrink-0`}>{p.type}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div><span className="text-stone-500">Volume</span><div className="text-stone-100">{formatCurrency(volume)}</div></div>
              <div><span className="text-stone-500">Revenue</span><div className="text-arbor-green">{formatCurrency(revenue)}</div></div>
              <div><span className="text-stone-500">Loans</span><div className="text-stone-100">{funded}/{leadCt}{open > 0 && <span className="text-amber-300"> · {open} open</span>}</div></div>
            </div>
            {lastFunded && <div className="font-mono text-[10px] text-stone-500 mt-1.5">last funded {lastFunded}</div>}
          </button>
        ))}
        {partners.length === 0 && (
          <div className="bg-stone-900/30 border border-stone-800 px-4 py-12 text-center text-stone-500 text-sm font-mono">
            No partners activated yet.
          </div>
        )}
      </div>
    </div>
  );
}

function LeadValueSummary({ leads }) {
  const summary = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    if (l.status === 'Funded') {
      acc.volume += Number(l.loanAmount) || 0;
      acc.revenue += Number(l.revenue) || 0;
    }
    if (l.status === 'Open') acc.openVolume += Number(l.loanAmount) || 0;
    return acc;
  }, { Open: 0, Funded: 0, Lost: 0, volume: 0, revenue: 0, openVolume: 0 });

  if (leads.length === 0) {
    return (
      <div className="text-stone-500 text-sm font-mono px-3 py-3 bg-stone-950/40 border border-stone-800">
        No leads logged. Click Add Lead to start tracking the value this prospect generates.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="border border-stone-800 p-2.5 bg-stone-950/40">
        <div className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Open</div>
        <div className="text-stone-100 text-sm font-medium">{summary.Open}</div>
        <div className="font-mono text-[10px] text-stone-500">{formatCurrency(summary.openVolume)}</div>
      </div>
      <div className="border border-arbor-green/30 p-2.5 bg-arbor-green/5">
        <div className="font-mono text-[9px] uppercase tracking-wider text-arbor-green">Funded</div>
        <div className="text-stone-100 text-sm font-medium">{summary.Funded}</div>
        <div className="font-mono text-[10px] text-stone-400">{formatCurrency(summary.volume)}</div>
      </div>
      <div className="border border-arbor-green/30 p-2.5 bg-arbor-green/5">
        <div className="font-mono text-[9px] uppercase tracking-wider text-arbor-green">Revenue</div>
        <div className="text-stone-100 text-sm font-medium">{formatCurrency(summary.revenue)}</div>
      </div>
      <div className="border border-stone-800 p-2.5 bg-stone-950/40">
        <div className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Lost</div>
        <div className="text-stone-100 text-sm font-medium">{summary.Lost}</div>
      </div>
    </div>
  );
}

// ============================================================================
// CALENDAR VIEW — chronological event log
// ============================================================================

function CalendarView({ events, prospects, onAdd, onEdit, onDelete, onOpen }) {
  const [scope, setScope] = useState('upcoming'); // upcoming | past | all
  const today = new Date().toISOString().slice(0, 10);

  const filtered = events
    .filter(e => {
      if (scope === 'upcoming') return e.date >= today;
      if (scope === 'past') return e.date < today;
      return true;
    })
    .sort((a, b) => scope === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));

  // Group by year-month for better scanning
  const groups = filtered.reduce((acc, e) => {
    const key = e.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-stone-100">Calendar</h2>
          <div className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mt-1">Open houses, networking, workshops · attached prospects auto-get an Event touch</div>
        </div>
        <button onClick={onAdd} className="bg-arbor-green text-stone-950 px-3 sm:px-4 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-arbor-green-dark whitespace-nowrap">
          <Plus size={14} /> <span className="hidden sm:inline">Log Event</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-stone-900/30 border border-stone-800 self-start w-fit">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'past', label: 'Past' },
          { id: 'all', label: 'All' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setScope(t.id)}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
              scope === t.id ? 'bg-arbor-green text-stone-950' : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-stone-900/30 border border-stone-800 px-4 py-12 text-center text-stone-500 font-mono text-sm">
          No {scope === 'all' ? '' : scope + ' '}events. Click Log Event to record an open house, networking event, or workshop.
        </div>
      ) : (
        Object.entries(groups).map(([ym, items]) => {
          const [yr, mo] = ym.split('-');
          const monthLabel = new Date(Number(yr), Number(mo) - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
          return (
            <div key={ym} className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">{monthLabel}</div>
              <div className="bg-stone-900/30 border border-stone-800 divide-y divide-stone-800">
                {items.map(e => {
                  const linked = e.prospectIds?.map(id => prospects.find(p => p.id === id)).filter(Boolean) || [];
                  return (
                    <div key={e.id} className="px-4 py-3 flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                      <div className="flex sm:flex-col gap-3 sm:gap-1 sm:w-32 shrink-0">
                        <div className="font-display text-2xl text-stone-100 leading-none">{e.date.slice(8, 10)}</div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 flex flex-col">
                          <span>{new Date(e.date + 'T00:00:00').toLocaleString('en', { weekday: 'short' })}</span>
                          <span className="text-arbor-green">{e.type}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <button onClick={() => onEdit(e)} className="text-stone-100 hover:text-arbor-green text-left font-medium transition-colors">
                          {e.location || e.type}
                        </button>
                        <div className="font-mono text-[11px] text-stone-500 mt-0.5">Hosted by {e.host}</div>
                        {e.notes && <div className="text-xs text-stone-400 mt-1">{e.notes}</div>}
                        {linked.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {linked.map(p => (
                              <button
                                key={p.id}
                                onClick={() => onOpen(p)}
                                className="px-2 py-0.5 bg-stone-950 border border-stone-800 hover:border-arbor-green/40 font-mono text-[10px] text-stone-300 hover:text-arbor-green transition-colors"
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-start">
                        <button onClick={() => onEdit(e)} className="p-1.5 text-stone-400 hover:text-stone-100" title="Edit"><Edit2 size={13} /></button>
                        <button onClick={() => onDelete(e.id)} className="p-1.5 text-stone-500 hover:text-rose-400" title="Delete event"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ============================================================================
// LEAD FORM
// ============================================================================

function LeadForm({ initial, defaultProspectId, prospects, onSave, onClose, pushToast }) {
  const [data, setData] = useState({
    id: initial?.id || null,
    prospectId: initial?.prospectId || defaultProspectId || (prospects[0]?.id || ''),
    name: initial?.name || '',
    status: initial?.status || 'Open',
    loanAmount: initial?.loanAmount || '',
    revenue: initial?.revenue || '',
    fundedDate: initial?.fundedDate || '',
    notes: initial?.notes || '',
    createdAt: initial?.createdAt || '',
  });
  const [error, setError] = useState('');

  const submit = () => {
    if (!data.prospectId) { setError('Pick a referring prospect.'); pushToast?.('Pick a source', 'error'); return; }
    if (!data.name.trim()) { setError('Lead name is required.'); pushToast?.('Lead name is required', 'error'); return; }
    if (data.status === 'Funded' && !data.fundedDate) {
      setData(d => ({ ...d, fundedDate: new Date().toISOString().slice(0, 10) }));
    }
    onSave({
      ...data,
      loanAmount: Number(data.loanAmount) || 0,
      revenue: Number(data.revenue) || 0,
    });
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-lg" labelledBy="lead-form-title">
      <div className="px-5 sm:px-6 py-4 border-b border-stone-800 flex items-center justify-between">
        <h3 id="lead-form-title" className="font-display text-xl sm:text-2xl text-stone-100">{data.id ? 'Edit Lead' : 'Log Lead'}</h3>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-100" aria-label="Close"><X size={20} /></button>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <SelectField label="Referred by" value={data.prospectId} options={prospects.map(p => ({ value: p.id, label: `${p.name} · ${p.firm}` }))} onChange={v => setData({ ...data, prospectId: v })} />
        <Field label="Borrower / Lead Name" value={data.name} onChange={v => { setData({ ...data, name: v }); if (error) setError(''); }} required error={error && !data.name.trim()} placeholder="e.g., Aoki primary refinance" autoFocus />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <SelectField label="Status" value={data.status} options={LEAD_STATUSES} onChange={v => setData({ ...data, status: v })} />
          <Field label="Loan Amount ($)" type="number" value={data.loanAmount} onChange={v => setData({ ...data, loanAmount: v })} placeholder="0" />
          <Field label="Revenue ($)" type="number" value={data.revenue} onChange={v => setData({ ...data, revenue: v })} placeholder="0" />
        </div>
        {data.status === 'Funded' && (
          <Field label="Funded Date" type="date" value={data.fundedDate} onChange={v => setData({ ...data, fundedDate: v })} />
        )}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">Notes</label>
          <textarea
            value={data.notes}
            onChange={e => setData({ ...data, notes: e.target.value })}
            rows={3}
            className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-stone-100 text-sm focus:border-arbor-green focus:outline-none"
            placeholder="Loan type, pricing, anything notable…"
          />
        </div>
      </div>
      <div className="px-5 sm:px-6 py-4 border-t border-stone-800 flex items-center justify-end gap-3 sticky bottom-0 bg-stone-900">
        <button onClick={onClose} className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-stone-400 hover:text-stone-100">Cancel</button>
        <button onClick={submit} className="bg-arbor-green text-stone-950 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-arbor-green-dark">Save</button>
      </div>
    </ModalShell>
  );
}

// ============================================================================
// EVENT FORM
// ============================================================================

function EventForm({ initial, prospects, onSave, onClose, pushToast }) {
  const [data, setData] = useState({
    id: initial?.id || null,
    type: initial?.type || 'Open House Hosted',
    date: initial?.date || new Date().toISOString().slice(0, 10),
    location: initial?.location || '',
    host: initial?.host || 'Taylor',
    prospectIds: initial?.prospectIds || [],
    notes: initial?.notes || '',
    createdAt: initial?.createdAt || '',
  });
  const [error, setError] = useState('');

  const togglePid = (id) => {
    setData(d => ({
      ...d,
      prospectIds: d.prospectIds.includes(id)
        ? d.prospectIds.filter(x => x !== id)
        : [...d.prospectIds, id]
    }));
  };

  const submit = () => {
    if (!data.date) { setError('Date is required.'); pushToast?.('Date is required', 'error'); return; }
    onSave(data);
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl" labelledBy="event-form-title">
      <div className="px-5 sm:px-6 py-4 border-b border-stone-800 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-arbor-green">Calendar Entry</div>
          <h3 id="event-form-title" className="font-display text-xl sm:text-2xl text-stone-100 mt-0.5">{data.id ? 'Edit Event' : 'Log Event'}</h3>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-100" aria-label="Close"><X size={20} /></button>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <SelectField label="Type" value={data.type} options={EVENT_TYPES} onChange={v => setData({ ...data, type: v })} />
          <Field label="Date" type="date" value={data.date} onChange={v => setData({ ...data, date: v })} required error={error && !data.date} />
          <SelectField label="Host" value={data.host} options={[...OWNERS, 'Margaret']} onChange={v => setData({ ...data, host: v })} />
        </div>
        <Field label="Location" value={data.location} onChange={v => setData({ ...data, location: v })} placeholder="Address or venue (optional)" />
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">Linked Prospects · {data.prospectIds.length} selected</label>
          <p className="text-[11px] text-stone-500 mb-2 font-mono">Each linked prospect will get an "Event" touch logged automatically when this is saved.</p>
          <div className="max-h-44 overflow-auto bg-stone-950 border border-stone-700 divide-y divide-stone-800">
            {prospects.length === 0 && <div className="px-3 py-4 text-stone-500 text-sm font-mono text-center">No prospects yet.</div>}
            {prospects.map(p => {
              const checked = data.prospectIds.includes(p.id);
              return (
                <label key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-stone-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePid(p.id)}
                    className="w-4 h-4 accent-arbor-green"
                  />
                  <span className="text-stone-100 truncate flex-1">{p.name}</span>
                  <span className={`font-mono text-[10px] ${TYPE_COLORS[p.type]}`}>{p.type}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">Notes</label>
          <textarea
            value={data.notes}
            onChange={e => setData({ ...data, notes: e.target.value })}
            rows={3}
            placeholder="What happened, who else was there, what to follow up on"
            className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-stone-100 text-sm focus:border-arbor-green focus:outline-none"
          />
        </div>
        {!data.id && data.prospectIds.length > 0 && (
          <div className="bg-stone-950 border border-stone-800 px-3 py-2 font-mono text-[10px] text-stone-500">
            <span className="text-arbor-green">[auto]</span> Saving will log an Event touch on {data.prospectIds.length} prospect{data.prospectIds.length === 1 ? '' : 's'} dated {data.date}.
          </div>
        )}
      </div>
      <div className="px-5 sm:px-6 py-4 border-t border-stone-800 flex items-center justify-end gap-3 sticky bottom-0 bg-stone-900">
        <button onClick={onClose} className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-stone-400 hover:text-stone-100">Cancel</button>
        <button onClick={submit} className="bg-arbor-green text-stone-950 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-arbor-green-dark">Save Event</button>
      </div>
    </ModalShell>
  );
}

// ============================================================================
// PROSPECT DETAIL DRAWER (with activity timeline)
// ============================================================================

function ProspectDetail({ prospect, activities, leads = [], eiosConfig, onClose, onEdit, onLog, onDelete, onAdvance, onRequestCode, onArchive, onAddLead, onEditLead, onDeleteLead }) {
  if (!prospect) return null;
  const sorted = [...activities].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const days = daysSince(prospect.lastTouch);
  const stageIdx = STAGES.indexOf(prospect.stage);

  return (
    <div
      className="fixed inset-0 bg-stone-950/80 backdrop-blur z-40 flex justify-end animate-[fadeIn_120ms_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Prospect detail for ${prospect.name}`}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="bg-stone-900 border-l border-stone-800 w-full max-w-xl h-full overflow-y-auto shadow-2xl shadow-black/50 animate-[slideInRight_180ms_ease-out]"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-800 sticky top-0 bg-stone-900 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border ${STAGE_COLORS[prospect.stage]}`}>{prospect.stage}</span>
                <span className={`font-mono text-[10px] uppercase tracking-wider ${TYPE_COLORS[prospect.type]}`}>{prospect.type}</span>
                <span className="font-mono text-[10px] text-stone-500">{prospect.owner}</span>
                {prospect.archived && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-amber-500/40 text-amber-300 bg-amber-950/40">Archived</span>
                )}
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-stone-100 mt-1.5 leading-tight">{prospect.name}</h3>
              <div className="text-sm text-stone-400 mt-0.5">{prospect.firm}{prospect.city && ` · ${prospect.city}`}</div>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-100 shrink-0" aria-label="Close"><X size={20} /></button>
          </div>

          {/* Stage advance */}
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-2">Advance Stage</div>
            <div className="flex flex-wrap gap-1">
              {STAGES.map((s, i) => (
                <button
                  key={s}
                  onClick={() => onAdvance(prospect.id, s)}
                  className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                    s === prospect.stage
                      ? 'bg-arbor-green text-stone-950 border-arbor-green'
                      : i < stageIdx
                        ? 'bg-stone-900 text-stone-500 border-stone-800 hover:border-stone-600'
                        : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-arbor-green/50 hover:text-arbor-green'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Action row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => onLog(prospect.id)} className="bg-arbor-green text-stone-950 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider hover:bg-arbor-green-dark flex items-center gap-1.5">
              <Activity size={13} /> Log Touch
            </button>
            <button onClick={() => onEdit(prospect)} className="bg-stone-800 text-stone-200 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider hover:bg-stone-700 flex items-center gap-1.5">
              <Edit2 size={13} /> Edit
            </button>
            {prospect.eiosId && eiosConfig.baseUrl && (
              <a href={`${eiosConfig.baseUrl}${prospect.eiosId}`} target="_blank" rel="noreferrer" className="bg-stone-800 text-stone-200 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider hover:bg-stone-700 flex items-center gap-1.5">
                <span>⎘</span> Open in EiOS
              </a>
            )}
            <button
              onClick={() => onArchive(prospect.id, !prospect.archived)}
              className={`ml-auto px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                prospect.archived
                  ? 'bg-arbor-green/15 text-arbor-green border border-arbor-green/40 hover:bg-arbor-green/25'
                  : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
              }`}
              title={prospect.archived ? 'Restore to active pipeline' : 'Archive (soft-delete; can restore later)'}
            >
              {prospect.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
              {prospect.archived ? 'Unarchive' : 'Archive'}
            </button>
            <button onClick={() => onDelete(prospect.id)} className="text-stone-500 hover:text-rose-400 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5" title="Hard delete (removes prospect + all logged touches)">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* At-a-glance */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="border border-stone-800 p-3 bg-stone-950/40">
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">Last Touch</div>
              <div className="text-stone-100 text-sm font-medium">{prospect.lastTouch || <span className="text-stone-500">—</span>}</div>
              {days !== null && <div className="font-mono text-[10px] text-stone-500 mt-0.5">{days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}</div>}
            </div>
            <div className="border border-stone-800 p-3 bg-stone-950/40">
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">Touches Logged</div>
              <div className="text-stone-100 text-sm font-medium">{sorted.length}</div>
            </div>
            <div className="border border-stone-800 p-3 bg-stone-950/40 col-span-2 sm:col-span-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">EiOS</div>
              <div className="text-stone-100 text-sm font-medium font-mono truncate">
                {prospect.eiosId || <span className="text-stone-500 normal-case">not linked</span>}
              </div>
            </div>
          </div>

          {/* Next action */}
          {prospect.nextAction && (
            <div className="border-l-2 border-arbor-green/60 pl-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-arbor-green mb-1">Next Action{prospect.nextActionDate && ` · ${prospect.nextActionDate}`}</div>
              <div className="text-stone-200 text-sm leading-relaxed">{prospect.nextAction}</div>
            </div>
          )}

          {/* Contact */}
          {(prospect.phone || prospect.email || prospect.linkedinUrl || prospect.websiteUrl || prospect.instagramUrl) && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-2">Contact</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {prospect.phone && <ContactRow icon={Phone} label={prospect.phone} href={`tel:${prospect.phone.replace(/[^0-9+]/g, '')}`} />}
                {prospect.email && <ContactRow icon={Mail} label={prospect.email} href={`mailto:${prospect.email}`} />}
                {prospect.linkedinUrl && <ContactRow icon={Linkedin} label="LinkedIn" href={prospect.linkedinUrl} external />}
                {prospect.websiteUrl && <ContactRow icon={Globe} label="Website" href={prospect.websiteUrl} external />}
                {prospect.instagramUrl && <ContactRow icon={Instagram} label="Instagram" href={prospect.instagramUrl} external />}
              </div>
            </div>
          )}

          {/* Research */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-2">Research</div>
            <div className="space-y-2">
              {prospect.type === 'Realtor' && (
                <ResearchCard
                  label="RETR"
                  sub="Real Estate Transaction Report"
                  url={prospect.retrUrl}
                  emptyHint="Add a RETR URL via the Edit form."
                />
              )}
              <div className="border border-stone-800 bg-stone-950/40 p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-arbor-green flex items-center gap-1.5">
                      <FileText size={11} /> CODE Dossier
                    </div>
                    <div className="text-stone-300 text-sm mt-0.5">The Arbor research file on this prospect</div>
                    {prospect.codeRequestedAt && !prospect.codeUrl && (
                      <div className="font-mono text-[10px] text-amber-300 mt-1">
                        Requested {new Date(prospect.codeRequestedAt).toLocaleDateString()} · pending
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {prospect.codeUrl && (
                    <a
                      href={prospect.codeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-stone-800 text-stone-200 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:bg-stone-700 flex items-center gap-1.5"
                    >
                      Open Dossier <ArrowRight size={11} />
                    </a>
                  )}
                  <button
                    onClick={() => onRequestCode(prospect.id)}
                    className="bg-arbor-green/15 text-arbor-green border border-arbor-green/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:bg-arbor-green/25 flex items-center gap-1.5"
                  >
                    <Sparkles size={11} /> {prospect.codeUrl ? 'Regenerate' : 'Generate Dossier'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {prospect.notes && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-2">Notes</div>
              <div className="text-stone-200 text-sm whitespace-pre-wrap leading-relaxed">{prospect.notes}</div>
            </div>
          )}

          {/* Leads */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500">Leads · Value</div>
              <button
                onClick={() => onAddLead(prospect.id)}
                className="font-mono text-[10px] uppercase tracking-wider text-arbor-green hover:text-arbor-green-dark flex items-center gap-1"
              >
                <Plus size={11} /> Add Lead
              </button>
            </div>
            <LeadValueSummary leads={leads} />
            {leads.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {leads.map(l => (
                  <div key={l.id} className="flex items-center gap-3 px-3 py-2 bg-stone-950/40 border border-stone-800 text-sm">
                    <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border shrink-0 ${LEAD_STATUS_COLORS[l.status]}`}>{l.status}</span>
                    <button onClick={() => onEditLead(l)} className="flex-1 text-left text-stone-100 hover:text-arbor-green transition-colors min-w-0 truncate">{l.name}</button>
                    <span className="font-mono text-[11px] text-stone-400 shrink-0">{formatCurrency(l.loanAmount)}</span>
                    {l.status === 'Funded' && <span className="font-mono text-[11px] text-arbor-green shrink-0">{formatCurrency(l.revenue)}</span>}
                    <button onClick={() => onDeleteLead(l.id)} className="p-1 text-stone-500 hover:text-rose-400 shrink-0" title="Delete lead"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500">Activity Timeline</div>
              <span className="font-mono text-[10px] text-stone-500">{sorted.length} entries</span>
            </div>
            {sorted.length === 0 ? (
              <div className="text-stone-500 text-sm font-mono px-4 py-8 text-center bg-stone-950/40 border border-stone-800">
                No touches logged yet.
              </div>
            ) : (
              <ol className="relative border-l border-stone-800 ml-2">
                {sorted.map(a => (
                  <li key={a.id} className="pl-4 pb-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-arbor-green/70 ring-2 ring-stone-900" />
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[11px] text-stone-500">{a.date}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-arbor-green">{a.type}</span>
                      <span className="font-mono text-[10px] text-stone-500">{a.owner}</span>
                    </div>
                    <div className="text-stone-200 text-sm leading-relaxed">{a.outcome}</div>
                    {a.next && <div className="text-stone-500 text-xs mt-1 italic">Next: {a.next}</div>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ContactRow({ icon: Icon, label, href, external }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="flex items-center gap-2.5 text-sm text-stone-200 hover:text-arbor-green transition-colors group min-w-0 py-1"
    >
      <Icon size={14} className="text-stone-500 group-hover:text-arbor-green transition-colors shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}

function ResearchCard({ label, sub, url, emptyHint }) {
  return (
    <div className="border border-stone-800 bg-stone-950/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-arbor-green">{label}</div>
          <div className="text-stone-300 text-sm mt-0.5">{sub}</div>
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="bg-stone-800 text-stone-200 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:bg-stone-700 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            Open <ArrowRight size={11} />
          </a>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 shrink-0">no link</span>
        )}
      </div>
      {!url && emptyHint && (
        <p className="text-[11px] text-stone-500 mt-2 font-mono">{emptyHint}</p>
      )}
    </div>
  );
}

// Inline contact action icons that appear next to a name in card/list views.
// Clicking each opens the platform-native handler: tel: for call, sms: for
// text, mailto: for email, plus a LinkedIn link out. e.stopPropagation on each
// so they don't trigger the parent row's onClick (which opens the drawer).
function ContactBadges({ prospect, size = 12, hideEmpty = true }) {
  if (!prospect) return null;
  const phoneClean = prospect.phone ? prospect.phone.replace(/[^0-9+]/g, '') : '';
  const items = [
    prospect.phone && {
      key: 'call',
      href: `tel:${phoneClean}`,
      icon: Phone,
      title: `Call ${prospect.phone}`,
      hover: 'hover:text-arbor-green',
    },
    prospect.phone && {
      key: 'sms',
      href: `sms:${phoneClean}`,
      icon: MessageBubble,
      title: `Text ${prospect.phone}`,
      hover: 'hover:text-arbor-green',
    },
    prospect.email && {
      key: 'email',
      href: `mailto:${prospect.email}`,
      icon: Mail,
      title: `Email ${prospect.email}`,
      hover: 'hover:text-arbor-green',
    },
    prospect.linkedinUrl && {
      key: 'linkedin',
      href: prospect.linkedinUrl,
      icon: Linkedin,
      title: 'Open LinkedIn',
      hover: 'hover:text-[#0A66C2]',
      external: true,
    },
  ].filter(Boolean);

  if (hideEmpty && items.length === 0) return null;

  return (
    <div className="flex items-center gap-1 shrink-0">
      {items.map(it => {
        const Icon = it.icon;
        return (
          <a
            key={it.key}
            href={it.href}
            {...(it.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            onClick={(e) => e.stopPropagation()}
            className={`text-stone-500 ${it.hover} transition-colors p-0.5 -m-0.5`}
            title={it.title}
            aria-label={it.title}
          >
            <Icon size={size} />
          </a>
        );
      })}
    </div>
  );
}


// ============================================================================
// TOAST + CONFIRM
// ============================================================================

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] space-y-2 pointer-events-none flex flex-col items-stretch sm:items-end">
      {toasts.map(t => {
        const tone = t.kind === 'error'
          ? 'border-rose-500/60 bg-rose-950/90 text-rose-100'
          : t.kind === 'success'
            ? 'border-arbor-green/60 bg-stone-900/95 text-stone-100'
            : 'border-stone-700 bg-stone-900/95 text-stone-200';
        const accent = t.kind === 'error' ? 'text-rose-400' : t.kind === 'success' ? 'text-arbor-green' : 'text-stone-400';
        const icon = t.kind === 'error' ? '⚠' : t.kind === 'success' ? '◉' : '•';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto border ${tone} px-3.5 py-2.5 shadow-lg shadow-black/30 sm:max-w-sm flex items-start gap-2.5 animate-[slideInRight_180ms_ease-out]`}
            role="status"
          >
            <span className={`font-mono text-xs ${accent} mt-0.5`}>{icon}</span>
            <div className="text-sm leading-snug flex-1">{t.message}</div>
            <button onClick={() => onDismiss(t.id)} className="text-stone-500 hover:text-stone-100 shrink-0" aria-label="Dismiss"><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel = 'Confirm', destructive = false, onConfirm, onCancel }) {
  return (
    <ModalShell onClose={onCancel} maxWidth="max-w-md" labelledBy="confirm-title">
      <div className="p-5 sm:p-6">
        <h3 id="confirm-title" className="font-display text-xl text-stone-100 mb-2">{title}</h3>
        {body && <p className="text-sm text-stone-300 leading-relaxed">{body}</p>}
      </div>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-stone-400 hover:text-stone-100">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          autoFocus
          className={`px-4 py-2 font-mono text-xs uppercase tracking-wider ${
            destructive
              ? 'bg-rose-500 text-stone-950 hover:bg-rose-400'
              : 'bg-arbor-green text-stone-950 hover:bg-arbor-green-dark'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
