import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    portfolioConfigAPI,
    aiAPI,
    profileAPI,
    projectsAPI,
    getErrorMessage,
} from '../services/api';
import {
    type PortfolioConfig,
    type AnimationStyle,
    type AnimationIntensity,
    type SectionId,
    THEME_PRESETS_LIST,
    SECTION_METADATA,
    DEFAULT_PORTFOLIO_CONFIG,
} from '../config/portfolioConfig';
import toast from 'react-hot-toast';
import {
    HiOutlineSparkles,
    HiOutlinePaperAirplane,
    HiOutlineRefresh,
    HiOutlineExternalLink,
    HiOutlineCheck,
    HiOutlineTrash,
    HiOutlineArrowUp,
    HiOutlineArrowDown,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineDesktopComputer,
    HiOutlineDeviceMobile,
    HiOutlineDeviceTablet,
    HiOutlineCode,
    HiOutlineClock,
    HiOutlineColorSwatch,
    HiOutlineAdjustments,
} from 'react-icons/hi';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    proposedConfig?: PortfolioConfig;
    proposedBio?: string;
    action?: string;
    timestamp: string;
}

export const AiStudioPage = () => {
    const { admin } = useAuth();
    const username = admin?.username || 'umaisrehman';

    // Core States
    const [config, setConfig] = useState<PortfolioConfig>(DEFAULT_PORTFOLIO_CONFIG);
    const [publishedConfig, setPublishedConfig] = useState<PortfolioConfig | null>(null);
    const [publishedAt, setPublishedAt] = useState<string | null>(null);
    const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // Navigation & View Mode
    const [activeTab, setActiveTab] = useState<'chat' | 'theme' | 'sections' | 'github' | 'history'>('chat');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [expandedSection, setExpandedSection] = useState<SectionId | null>('hero');

    // Chat States
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const saved = localStorage.getItem(`ai_studio_chat_${username}`);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return [
            {
                id: 'welcome',
                sender: 'ai',
                text: `Assalam-o-Alaikum ${admin?.name || ''}! Main aapka **Portfolio AI Copilot** hoon.\n\nAap mujhse ye kaam karwa sakte hain:\n• **Bio Polish**: Apna draft text likhein, main Senior Software Engineer level ka professional paragraph bana kar doonga.\n• **Theme Change**: Kahiye *"Emerald theme lagao"* ya *"Cyberpunk theme kar do"*.\n• **Animations**: Kahiye *"Buddies animation lively kar do"* ya *"Ambient style lagao"*.\n• **Layout & Headings**: Sections ko hide/show ya rename karein.\n• **GitHub Auto-import**: GitHub URL de kar direct skills aur projects extract karein!`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
        ];
    });
    const [inputMessage, setInputMessage] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // GitHub Importer State
    const [githubInput, setGithubInput] = useState('');
    const [githubExtracting, setGithubExtracting] = useState(false);
    const [githubResult, setGithubResult] = useState<any | null>(null);
    const [importingToDb, setImportingToDb] = useState(false);

    // Version History State
    const [versions, setVersions] = useState<Array<{ _id: string; note: string; source: string; createdAt: string }>>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);

    // Live Preview Iframe Ref
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const clientBaseUrl = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';
    const previewUrl = `${clientBaseUrl}/${username}`;

    // 1. Initial Load: Fetch Draft & Published Config
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await portfolioConfigAPI.getDraft();
                if (res.data?.success) {
                    const draft = res.data.draft || DEFAULT_PORTFOLIO_CONFIG;
                    setConfig(draft);
                    setPublishedConfig(res.data.published);
                    setPublishedAt(res.data.publishedAt);
                }
            } catch (err) {
                console.error('Failed to load portfolio config:', err);
            }
        };
        loadConfig();
    }, []);

    // 2. Persist chat messages to localStorage
    useEffect(() => {
        localStorage.setItem(`ai_studio_chat_${username}`, JSON.stringify(messages));
    }, [messages, username]);

    // 3. Scroll chat to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, aiLoading]);

    // 4. Synchronize config to live preview iframe via postMessage
    const syncPreviewIframe = (cfg: PortfolioConfig) => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                { type: 'PORTFOLIO_CONFIG_PREVIEW', config: cfg },
                '*'
            );
        }
    };

    useEffect(() => {
        syncPreviewIframe(config);
    }, [config]);

    // Send AI Message
    const handleSendMessage = async (customText?: string) => {
        const textToSend = (customText || inputMessage).trim();
        if (!textToSend || aiLoading) return;

        const userMsg: ChatMessage = {
            id: String(Date.now()),
            sender: 'user',
            text: textToSend,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputMessage('');
        setAiLoading(true);

        try {
            const chatHistory = messages.slice(-6).map((m) => ({
                sender: m.sender,
                text: m.text,
            }));

            const res = await aiAPI.chat(textToSend, chatHistory, config);

            if (res.data?.success) {
                const aiReply: ChatMessage = {
                    id: String(Date.now() + 1),
                    sender: 'ai',
                    text: res.data.reply,
                    proposedConfig: res.data.proposedConfig,
                    proposedBio: res.data.proposedBio,
                    action: res.data.action,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };

                setMessages((prev) => [...prev, aiReply]);

                // If AI proposed a valid config, preview it automatically!
                if (res.data.proposedConfig) {
                    setConfig(res.data.proposedConfig);
                    setHasUnsavedDraft(true);
                    syncPreviewIframe(res.data.proposedConfig);
                    toast.success('Live preview updated with AI configuration!', { icon: '✨' });
                }
            }
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setAiLoading(false);
        }
    };

    // Apply Proposed Bio to User Profile
    const handleApplyBio = async (newBio: string) => {
        const toastId = toast.loading('Updating profile About bio...');
        try {
            const formData = new FormData();
            formData.append('bio', newBio);
            await profileAPI.update(formData);
            toast.success('Profile bio updated successfully!', { id: toastId });
            reloadIframe();
        } catch (err) {
            toast.error(getErrorMessage(err), { id: toastId });
        }
    };

    // Save Draft to Server
    const handleSaveDraft = async (targetConfig = config) => {
        setSaving(true);
        try {
            const res = await portfolioConfigAPI.saveDraft(targetConfig);
            if (res.data.success) {
                setHasUnsavedDraft(false);
                toast.success('Draft saved successfully!');
            }
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    // Publish to Live
    const handlePublish = async () => {
        if (!window.confirm('Do you want to publish these changes live to your public portfolio?')) {
            return;
        }

        setPublishing(true);
        const toastId = toast.loading('Publishing live portfolio configuration...');
        try {
            const res = await portfolioConfigAPI.publish('Published from AI Studio', 'ai');
            if (res.data.success) {
                setPublishedConfig(res.data.published);
                setPublishedAt(res.data.publishedAt);
                setHasUnsavedDraft(false);
                toast.success('Portfolio is now LIVE with updated design! 🚀', { id: toastId });
                reloadIframe();
            }
        } catch (err) {
            toast.error(getErrorMessage(err), { id: toastId });
        } finally {
            setPublishing(false);
        }
    };

    // Reset Draft to Default
    const handleReset = async () => {
        if (!window.confirm('Reset all layout and theme customizations to platform defaults?')) {
            return;
        }

        try {
            const res = await portfolioConfigAPI.reset();
            if (res.data.success) {
                setConfig(res.data.draft);
                setHasUnsavedDraft(true);
                syncPreviewIframe(res.data.draft);
                toast.success('Reset to defaults in preview');
            }
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    // GitHub Extraction
    const handleExtractGitHub = async () => {
        if (!githubInput.trim()) {
            toast.error('Please enter a GitHub username or URL');
            return;
        }

        setGithubExtracting(true);
        try {
            const res = await aiAPI.extractGitHub(githubInput.trim());
            if (res.data.success) {
                setGithubResult(res.data.data);
                toast.success(res.data.message);
            }
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setGithubExtracting(false);
        }
    };

    // Import GitHub Profile & Projects into DB
    const handleImportGitHubToDatabase = async () => {
        if (!githubResult) return;
        setImportingToDb(true);
        const toastId = toast.loading('Importing GitHub data into your profile & projects...');

        try {
            // 1. Update Profile (bio + skills)
            const formData = new FormData();
            if (githubResult.bio) formData.append('bio', githubResult.bio);
            if (githubResult.skills?.length) {
                formData.append('skills', JSON.stringify(githubResult.skills));
            }
            await profileAPI.update(formData);

            // 2. Create projects if present
            if (githubResult.suggestedProjects?.length) {
                for (const proj of githubResult.suggestedProjects.slice(0, 4)) {
                    const pForm = new FormData();
                    pForm.append('title', proj.title);
                    pForm.append('description', proj.tagline);
                    pForm.append('category', proj.category || 'fullstack');
                    pForm.append('githubUrl', proj.githubUrl);
                    pForm.append('liveUrl', proj.liveUrl || '');
                    pForm.append('featured', 'true');
                    proj.technologies.forEach((t: string) => pForm.append('techStack[]', t));
                    try {
                        await projectsAPI.create(pForm);
                    } catch (e) {
                        // skip duplicate or individual failure
                    }
                }
            }

            toast.success('GitHub profile and top repositories imported successfully! 🚀', { id: toastId });
            setGithubResult(null);
            setGithubInput('');
            reloadIframe();
        } catch (err) {
            toast.error(getErrorMessage(err), { id: toastId });
        } finally {
            setImportingToDb(false);
        }
    };

    // Version History
    const loadVersionHistory = async () => {
        setLoadingVersions(true);
        try {
            const res = await portfolioConfigAPI.getVersions();
            if (res.data.success) {
                setVersions(res.data.versions);
            }
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoadingVersions(false);
        }
    };

    const handleRollback = async (versionId: string, applyLive = false) => {
        try {
            const res = await portfolioConfigAPI.rollback(versionId, applyLive);
            if (res.data.success) {
                setConfig(res.data.draft);
                if (res.data.published) {
                    setPublishedConfig(res.data.published);
                }
                syncPreviewIframe(res.data.draft);
                toast.success(res.data.message);
                reloadIframe();
            }
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    // Section Reordering Helpers
    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...config.sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;

        const [moved] = newSections.splice(index, 1);
        newSections.splice(targetIndex, 0, moved);

        const updated = { ...config, sections: newSections };
        setConfig(updated);
        setHasUnsavedDraft(true);
        syncPreviewIframe(updated);
    };

    const toggleSection = (id: SectionId) => {
        const newSections = config.sections.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        );
        const updated = { ...config, sections: newSections };
        setConfig(updated);
        setHasUnsavedDraft(true);
        syncPreviewIframe(updated);
    };

    const updateSectionText = (id: SectionId, field: 'badge' | 'title' | 'highlight' | 'subtitle', val: string) => {
        const newSections = config.sections.map((s) =>
            s.id === id ? { ...s, [field]: val } : s
        );
        const updated = { ...config, sections: newSections };
        setConfig(updated);
        setHasUnsavedDraft(true);
        syncPreviewIframe(updated);
    };

    const reloadIframe = () => {
        if (iframeRef.current) {
            iframeRef.current.src = `${previewUrl}?t=${Date.now()}`;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', margin: '-24px', background: '#0b1120', color: '#f8fafc', overflow: 'hidden' }}>
            {/* Top Navigation & Status Bar */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(34, 211, 238, 0.2))', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                        <HiOutlineSparkles style={{ color: '#38bdf8', fontSize: '1.25rem' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.98rem', letterSpacing: '0.02em' }}>AI Portfolio Studio</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '4px 10px', borderRadius: 20, background: hasUnsavedDraft ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: hasUnsavedDraft ? '#fbbf24' : '#34d399', border: `1px solid ${hasUnsavedDraft ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: hasUnsavedDraft ? '#fbbf24' : '#34d399' }} />
                        {hasUnsavedDraft ? 'Unsaved Draft Changes' : publishedConfig ? 'Draft Synced' : 'Ready'}
                    </div>

                    {publishedAt && (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Last Published: {new Date(publishedAt).toLocaleDateString()} {new Date(publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {hasUnsavedDraft && (
                        <button
                            onClick={() => handleSaveDraft()}
                            disabled={saving}
                            style={{ padding: '7px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {saving ? 'Saving Draft...' : 'Save Draft'}
                        </button>
                    )}

                    <button
                        onClick={handleReset}
                        style={{ padding: '7px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #334155', color: '#94a3b8', fontSize: '0.84rem', cursor: 'pointer' }}
                        title="Reset draft to platform defaults"
                    >
                        Reset Defaults
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #3b82f6)', border: 'none', color: '#ffffff', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)' }}
                    >
                        <HiOutlineCheck />
                        {publishing ? 'Publishing...' : 'Publish Live 🚀'}
                    </button>

                    <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', fontSize: '0.84rem', textDecoration: 'none', fontWeight: 600 }}
                    >
                        View Live <HiOutlineExternalLink />
                    </a>
                </div>
            </header>

            {/* Split Screen Container */}
            <div style={{ display: 'grid', gridTemplateColumns: '46% 54%', flex: 1, overflow: 'hidden' }}>
                {/* LEFT PANE: Studio Controls & AI Copilot */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', background: '#0b1120', overflow: 'hidden' }}>
                    {/* Mode Navigation Tabs */}
                    <div style={{ display: 'flex', background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0 12px' }}>
                        {[
                            { id: 'chat', label: 'AI Copilot', icon: HiOutlineSparkles },
                            { id: 'theme', label: 'Theme & Style', icon: HiOutlineColorSwatch },
                            { id: 'sections', label: 'Sections Layout', icon: HiOutlineAdjustments },
                            { id: 'github', label: 'GitHub Import', icon: HiOutlineCode },
                            { id: 'history', label: 'Snapshots', icon: HiOutlineClock },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as any);
                                        if (tab.id === 'history') loadVersionHistory();
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '11px 14px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                                        color: isActive ? '#38bdf8' : '#94a3b8',
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: '0.86rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <Icon />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* TAB CONTENT 1: AI COPILOT CHAT */}
                    {activeTab === 'chat' && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            {/* Messages Container */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {messages.map((m) => {
                                    const isAi = m.sender === 'ai';
                                    return (
                                        <div
                                            key={m.id}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isAi ? 'flex-start' : 'flex-end',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    maxWidth: '88%',
                                                    padding: '12px 16px',
                                                    borderRadius: 14,
                                                    background: isAi ? '#1e293b' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                                    color: '#f8fafc',
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.55,
                                                    border: isAi ? '1px solid #334155' : 'none',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                    whiteSpace: 'pre-wrap',
                                                }}
                                            >
                                                {m.text}

                                                {/* Proposed Bio Card */}
                                                {m.proposedBio && (
                                                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 10, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                                        <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, marginBottom: 6 }}>
                                                            PROPOSED ABOUT BIO:
                                                        </div>
                                                        <p style={{ fontSize: '0.85rem', color: '#e2e8f0', fontStyle: 'italic', marginBottom: 10 }}>
                                                            "{m.proposedBio}"
                                                        </p>
                                                        <button
                                                            onClick={() => handleApplyBio(m.proposedBio!)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#0284c7', border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                                        >
                                                            <HiOutlineCheck /> Apply to My Profile
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Proposed Configuration Card */}
                                                {m.proposedConfig && (
                                                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                                                        <div style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 700, marginBottom: 6 }}>
                                                            APPLIED TO LIVE PREVIEW:
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: '#334155', color: '#cbd5e1' }}>
                                                                Theme: {m.proposedConfig.theme.preset}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: '#334155', color: '#cbd5e1' }}>
                                                                Animation: {m.proposedConfig.animation.style} ({m.proposedConfig.animation.intensity})
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handlePublish()}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                                        >
                                                            Publish This Layout Live 🚀
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4, padding: '0 4px' }}>
                                                {m.timestamp}
                                            </span>
                                        </div>
                                    );
                                })}

                                {aiLoading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#1e293b', borderRadius: 12, border: '1px solid #334155', width: 'fit-content' }}>
                                        <HiOutlineSparkles style={{ color: '#38bdf8', animation: 'spin 2s linear infinite' }} />
                                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>AI is analyzing and crafting suggestions...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Prompt Suggestions */}
                            <div style={{ display: 'flex', gap: 6, padding: '8px 14px', background: '#0f172a', borderTop: '1px solid #1e293b', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                {[
                                    'Improve my bio for senior roles',
                                    'Change theme to Emerald Tech',
                                    'Set animation to Cyber Buddies',
                                    'Hide the resume section',
                                    'What skills should I highlight?',
                                ].map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => handleSendMessage(prompt)}
                                        style={{ padding: '4px 10px', borderRadius: 14, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: '0.76rem', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        + {prompt}
                                    </button>
                                ))}
                            </div>

                            {/* Chat Input Bar */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                style={{ display: 'flex', gap: 8, padding: '12px 14px', background: '#0b1120', borderTop: '1px solid #1e293b' }}
                            >
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Ask AI: 'Polish my bio', 'Switch to ocean theme', 'Help with projects'..."
                                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.88rem', outline: 'none' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim() || aiLoading}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #3b82f6)', border: 'none', color: '#ffffff', fontSize: '1.1rem', cursor: 'pointer', opacity: !inputMessage.trim() ? 0.6 : 1 }}
                                >
                                    <HiOutlinePaperAirplane style={{ transform: 'rotate(90deg)' }} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMessages([])}
                                    title="Clear chat history"
                                    style={{ padding: '0 10px', borderRadius: 8, background: 'transparent', border: '1px solid #334155', color: '#64748b', cursor: 'pointer' }}
                                >
                                    <HiOutlineTrash />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB CONTENT 2: THEME & ANIMATION PRESETS */}
                    {activeTab === 'theme' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Theme Presets */}
                            <div>
                                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: 4 }}>Color Theme Palette</h3>
                                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 14 }}>
                                    Select a curated design system preset. Preview updates instantly.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                                    {THEME_PRESETS_LIST.map((t) => {
                                        const isSelected = config.theme.preset === t.id;
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    const updated = { ...config, theme: { preset: t.id } };
                                                    setConfig(updated);
                                                    setHasUnsavedDraft(true);
                                                    syncPreviewIframe(updated);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                    padding: '12px',
                                                    borderRadius: 10,
                                                    background: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#1e293b',
                                                    border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                                                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.primary }} />
                                                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent }} />
                                                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.bg, border: '1px solid #475569' }} />
                                                </div>
                                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                                                    {t.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Animation Style */}
                            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20 }}>
                                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: 4 }}>Hero Animation Style</h3>
                                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 14 }}>
                                    Control the background interactive engine rendered in your Hero section.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        { id: 'buddies', label: 'Tech Buddies Arena (Game Characters)', desc: 'Multiplayer floating vector player characters with real-time bumper physics and glowing badges.' },
                                        { id: 'ambient', label: 'Floating 3D Tech Cosmos', desc: 'Gentle drifting tech ecosystem nodes with glowing aura and mouse interaction.' },
                                        { id: 'none', label: 'Clean Minimalist (No Characters)', desc: 'Pure typography and sleek gradients without moving character assets.' },
                                    ].map((style) => {
                                        const isSelected = config.animation.style === style.id;
                                        return (
                                            <button
                                                key={style.id}
                                                onClick={() => {
                                                    const updated = { ...config, animation: { ...config.animation, style: style.id as AnimationStyle } };
                                                    setConfig(updated);
                                                    setHasUnsavedDraft(true);
                                                    syncPreviewIframe(updated);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                    padding: '12px 14px',
                                                    borderRadius: 10,
                                                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#1e293b',
                                                    border: isSelected ? '2px solid #6366f1' : '1px solid #334155',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? '#818cf8' : '#e2e8f0', marginBottom: 2 }}>
                                                    {style.label}
                                                </span>
                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                    {style.desc}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Animation Intensity */}
                            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20 }}>
                                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: 4 }}>Animation Intensity / Speed</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                    {(['calm', 'normal', 'lively'] as AnimationIntensity[]).map((intensity) => {
                                        const isSelected = config.animation.intensity === intensity;
                                        return (
                                            <button
                                                key={intensity}
                                                onClick={() => {
                                                    const updated = { ...config, animation: { ...config.animation, intensity } };
                                                    setConfig(updated);
                                                    setHasUnsavedDraft(true);
                                                    syncPreviewIframe(updated);
                                                }}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: 8,
                                                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                                                    border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                                                    color: isSelected ? '#38bdf8' : '#e2e8f0',
                                                    fontWeight: isSelected ? 700 : 500,
                                                    fontSize: '0.84rem',
                                                    cursor: 'pointer',
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {intensity}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT 3: SECTIONS LAYOUT & HEADINGS */}
                    {activeTab === 'sections' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ marginBottom: 6 }}>
                                <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Custom Section Layout & Titles</h3>
                                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                    Reorder sections, toggle visibility, and customize headings directly.
                                </p>
                            </div>

                            {config.sections.map((section, idx) => {
                                const meta = SECTION_METADATA[section.id];
                                const isExpanded = expandedSection === section.id;

                                return (
                                    <div
                                        key={section.id}
                                        style={{
                                            borderRadius: 10,
                                            background: '#1e293b',
                                            border: section.enabled ? '1px solid #334155' : '1px dashed #475569',
                                            opacity: section.enabled ? 1 : 0.65,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#162032' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                                                    #{idx + 1}
                                                </span>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                                                        {meta?.label || section.id}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {/* Reorder Up/Down */}
                                                <button
                                                    onClick={() => moveSection(idx, 'up')}
                                                    disabled={idx === 0}
                                                    style={{ padding: 4, background: '#1e293b', border: '1px solid #334155', borderRadius: 4, color: '#94a3b8', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                                                    title="Move Section Up"
                                                >
                                                    <HiOutlineArrowUp />
                                                </button>
                                                <button
                                                    onClick={() => moveSection(idx, 'down')}
                                                    disabled={idx === config.sections.length - 1}
                                                    style={{ padding: 4, background: '#1e293b', border: '1px solid #334155', borderRadius: 4, color: '#94a3b8', cursor: 'pointer', opacity: idx === config.sections.length - 1 ? 0.3 : 1 }}
                                                    title="Move Section Down"
                                                >
                                                    <HiOutlineArrowDown />
                                                </button>

                                                {/* Visibility Toggle */}
                                                <button
                                                    onClick={() => toggleSection(section.id)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: 6,
                                                        background: section.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                        border: `1px solid ${section.enabled ? '#10b981' : '#ef4444'}`,
                                                        color: section.enabled ? '#34d399' : '#f87171',
                                                        fontSize: '0.74rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {section.enabled ? 'Active' : 'Hidden'}
                                                </button>

                                                {/* Expand editor */}
                                                <button
                                                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                                                    style={{ padding: 4, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                                >
                                                    {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Custom Text Form */}
                                        {isExpanded && (
                                            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #283548' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                                                        Badge Label (e.g. "Background", "Portfolio")
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={section.badge || ''}
                                                        onChange={(e) => updateSectionText(section.id, 'badge', e.target.value)}
                                                        placeholder={meta?.defaultBadge}
                                                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.84rem' }}
                                                    />
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                                                            Main Heading Title
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={section.title || ''}
                                                            onChange={(e) => updateSectionText(section.id, 'title', e.target.value)}
                                                            placeholder="Main title text"
                                                            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.84rem' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                                                            Gradient Highlight Words
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={section.highlight || ''}
                                                            onChange={(e) => updateSectionText(section.id, 'highlight', e.target.value)}
                                                            placeholder="Colored gradient accent"
                                                            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.84rem' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                                                        Subtitle Description
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        value={section.subtitle || ''}
                                                        onChange={(e) => updateSectionText(section.id, 'subtitle', e.target.value)}
                                                        placeholder="Supporting paragraph for this section..."
                                                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.84rem', resize: 'vertical' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* TAB CONTENT 4: GITHUB AUTO-IMPORTER */}
                    {activeTab === 'github' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div>
                                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: 4 }}>GitHub Data Auto-Extractor</h3>
                                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                    Auto-gather your skills, bio, and top repositories directly from your GitHub profile URL without typing.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    value={githubInput}
                                    onChange={(e) => setGithubInput(e.target.value)}
                                    placeholder="Enter github.com/username or @username"
                                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.88rem' }}
                                />
                                <button
                                    onClick={handleExtractGitHub}
                                    disabled={githubExtracting}
                                    style={{ padding: '0 18px', borderRadius: 8, background: '#0284c7', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer' }}
                                >
                                    {githubExtracting ? 'Analyzing...' : 'Extract Data'}
                                </button>
                            </div>

                            {githubResult && (
                                <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        {githubResult.avatarUrl && (
                                            <img src={githubResult.avatarUrl} alt="Avatar" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>{githubResult.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>@{githubResult.username}</div>
                                        </div>
                                    </div>

                                    {githubResult.bio && (
                                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 12 }}>
                                            {githubResult.bio}
                                        </p>
                                    )}

                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                                            DETECTED SKILLS ({githubResult.skills?.length || 0}):
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {(githubResult.skills || []).map((skill: string) => (
                                                <span key={skill} style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 4, background: '#0f172a', border: '1px solid #334155', color: '#38bdf8' }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                                            TOP REPOSITORIES DETECTED:
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {(githubResult.suggestedProjects || []).slice(0, 4).map((p: any) => (
                                                <div key={p.title} style={{ padding: '8px 10px', background: '#0f172a', borderRadius: 6, fontSize: '0.8rem' }}>
                                                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.title}</span>
                                                    <span style={{ color: '#94a3b8', marginLeft: 6 }}>— {p.tagline}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleImportGitHubToDatabase}
                                        disabled={importingToDb}
                                        style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
                                    >
                                        {importingToDb ? 'Importing Data...' : 'Import All Skills & Projects to Portfolio 🚀'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT 5: VERSION SNAPSHOTS & ROLLBACK */}
                    {activeTab === 'history' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: 4 }}>Saved Release Snapshots</h3>
                                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                    Every time you publish, a snapshot is preserved. Rollback any layout with 1-click.
                                </p>
                            </div>

                            {loadingVersions ? (
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading snapshots...</div>
                            ) : versions.length === 0 ? (
                                <div style={{ padding: 20, textAlign: 'center', background: '#1e293b', borderRadius: 10, color: '#94a3b8', fontSize: '0.85rem' }}>
                                    No published snapshots yet. Click "Publish Live" to create your first release snapshot.
                                </div>
                            ) : (
                                versions.map((v) => (
                                    <div
                                        key={v._id}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#1e293b', borderRadius: 8, border: '1px solid #334155' }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc' }}>
                                                {v.note || 'Snapshot'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {new Date(v.createdAt).toLocaleDateString()} at {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Source: {v.source}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                onClick={() => handleRollback(v._id, false)}
                                                style={{ padding: '5px 10px', borderRadius: 6, background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Preview Draft
                                            </button>
                                            <button
                                                onClick={() => handleRollback(v._id, true)}
                                                style={{ padding: '5px 10px', borderRadius: 6, background: '#334155', border: 'none', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Restore Live
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT PANE: LIVE INTERACTIVE PREVIEW */}
                <div style={{ display: 'flex', flexDirection: 'column', background: '#020617', height: '100%', overflow: 'hidden' }}>
                    {/* Preview Controls Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Live Preview
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: '#1e293b', color: '#38bdf8' }}>
                                {config.theme.preset} • {config.animation.style}
                            </span>
                        </div>

                        {/* Responsive Device Switcher */}
                        <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', borderRadius: 8, padding: 2 }}>
                            <button
                                onClick={() => setPreviewDevice('desktop')}
                                style={{ padding: '5px 9px', borderRadius: 6, background: previewDevice === 'desktop' ? '#334155' : 'transparent', border: 'none', color: previewDevice === 'desktop' ? '#38bdf8' : '#94a3b8', cursor: 'pointer' }}
                                title="Desktop 100%"
                            >
                                <HiOutlineDesktopComputer />
                            </button>
                            <button
                                onClick={() => setPreviewDevice('tablet')}
                                style={{ padding: '5px 9px', borderRadius: 6, background: previewDevice === 'tablet' ? '#334155' : 'transparent', border: 'none', color: previewDevice === 'tablet' ? '#38bdf8' : '#94a3b8', cursor: 'pointer' }}
                                title="Tablet 768px"
                            >
                                <HiOutlineDeviceTablet />
                            </button>
                            <button
                                onClick={() => setPreviewDevice('mobile')}
                                style={{ padding: '5px 9px', borderRadius: 6, background: previewDevice === 'mobile' ? '#334155' : 'transparent', border: 'none', color: previewDevice === 'mobile' ? '#38bdf8' : '#94a3b8', cursor: 'pointer' }}
                                title="Mobile 375px"
                            >
                                <HiOutlineDeviceMobile />
                            </button>
                        </div>

                        {/* Reload & Open Frame Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                onClick={reloadIframe}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}
                                title="Hard Reload Preview"
                            >
                                <HiOutlineRefresh /> Reload
                            </button>
                        </div>
                    </div>

                    {/* Preview Frame Wrapper */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', overflow: 'hidden', background: '#020617' }}>
                        <div
                            style={{
                                width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
                                height: '100%',
                                borderRadius: previewDevice === 'desktop' ? 0 : 16,
                                overflow: 'hidden',
                                boxShadow: previewDevice === 'desktop' ? 'none' : '0 20px 50px rgba(0,0,0,0.7)',
                                border: previewDevice === 'desktop' ? 'none' : '4px solid #1e293b',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                background: '#020617',
                            }}
                        >
                            <iframe
                                ref={iframeRef}
                                src={previewUrl}
                                title="Live Portfolio Preview"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                onLoad={() => syncPreviewIframe(config)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiStudioPage;
