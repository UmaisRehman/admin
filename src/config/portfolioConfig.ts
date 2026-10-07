export type ThemePreset = 'midnight' | 'emerald' | 'cyberpunk' | 'violet' | 'ocean';
export type SectionId = 'hero' | 'about' | 'projects' | 'whyHireMe' | 'resume' | 'contact';
export type AnimationStyle = 'buddies' | 'ambient' | 'none';
export type AnimationIntensity = 'calm' | 'normal' | 'lively';

export interface SectionConfig {
    id: SectionId;
    enabled: boolean;
    badge?: string;
    title?: string;
    highlight?: string;
    subtitle?: string;
}

export interface PortfolioConfig {
    version: 1;
    theme: {
        preset: ThemePreset;
    };
    animation: {
        style: AnimationStyle;
        intensity: AnimationIntensity;
    };
    sections: SectionConfig[];
}

export const SECTION_METADATA: Record<SectionId, { label: string; description: string; defaultBadge: string; defaultTitle: string }> = {
    hero: {
        label: 'Hero Section',
        description: 'Main introduction, headline, animated characters / canvas aura, and primary CTA buttons.',
        defaultBadge: 'Available for high-impact roles & projects',
        defaultTitle: "Hi, I'm Developer",
    },
    about: {
        label: 'About & Skills',
        description: 'Detailed bio, philosophy, core skills with vector brand badges, and contact details.',
        defaultBadge: 'Background',
        defaultTitle: 'Engineered with Precision & Passion',
    },
    projects: {
        label: 'Featured Projects',
        description: 'Bento grid of engineering work with category filters, modals, and tech tags.',
        defaultBadge: 'Portfolio',
        defaultTitle: 'Featured Engineering Work',
    },
    whyHireMe: {
        label: 'Client & Recruiter Advantage',
        description: '4 core engineering value pillars (Velocity, Clean Code, Polish, Ownership) and hiring checklist.',
        defaultBadge: 'Client & Recruiter Advantage',
        defaultTitle: 'Why Partner With Me',
    },
    resume: {
        label: 'Resume & Credentials',
        description: 'CV preview card with direct PDF download button.',
        defaultBadge: 'Credentials',
        defaultTitle: 'Professional Curriculum Vitae',
    },
    contact: {
        label: 'Contact & Hire Me',
        description: 'Contact form with direct email transmission and social links.',
        defaultBadge: 'Contact',
        defaultTitle: "Let's Build Something Great",
    },
};

export const THEME_PRESETS_LIST: Array<{ id: ThemePreset; label: string; primary: string; accent: string; bg: string }> = [
    { id: 'midnight', label: 'Midnight Indigo', primary: '#6366f1', accent: '#22d3ee', bg: '#020617' },
    { id: 'emerald', label: 'Emerald Tech', primary: '#10b981', accent: '#34d399', bg: '#031410' },
    { id: 'cyberpunk', label: 'Cyber Gold', primary: '#f59e0b', accent: '#eab308', bg: '#0f0a05' },
    { id: 'violet', label: 'Royal Violet', primary: '#8b5cf6', accent: '#ec4899', bg: '#0a0516' },
    { id: 'ocean', label: 'Deep Ocean', primary: '#0ea5e9', accent: '#38bdf8', bg: '#020c1b' },
];

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
    version: 1,
    theme: { preset: 'midnight' },
    animation: { style: 'buddies', intensity: 'normal' },
    sections: [
        { id: 'hero', enabled: true },
        { id: 'about', enabled: true },
        { id: 'projects', enabled: true },
        { id: 'whyHireMe', enabled: true },
        { id: 'resume', enabled: true },
        { id: 'contact', enabled: true },
    ],
};
