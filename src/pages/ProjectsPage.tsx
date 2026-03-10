import { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineExternalLink, HiOutlinePhotograph } from 'react-icons/hi';

interface Project {
    _id: string;
    title: string;
    description: string;
    techStack: string[];
    liveUrl: string;
    githubUrl: string;
    thumbnail: string;
    category: string;
    featured: boolean;
    order: number;
}

const ProjectsPage = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [techStack, setTechStack] = useState('');
    const [liveUrl, setLiveUrl] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [category, setCategory] = useState('Web App');
    const [featured, setFeatured] = useState(false);
    const [order, setOrder] = useState(0);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data } = await projectsAPI.getAll();
            setProjects(data.projects);
        } catch {
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle(''); setDescription(''); setTechStack('');
        setLiveUrl(''); setGithubUrl(''); setCategory('Web App');
        setFeatured(false); setOrder(0);
        setThumbnailFile(null); setThumbnailPreview('');
        setEditingProject(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setTitle(project.title);
        setDescription(project.description);
        setTechStack(project.techStack.join(', '));
        setLiveUrl(project.liveUrl);
        setGithubUrl(project.githubUrl);
        setCategory(project.category);
        setFeatured(project.featured);
        setOrder(project.order);
        setThumbnailPreview(project.thumbnail);
        setThumbnailFile(null);
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('techStack', JSON.stringify(techStack.split(',').map(s => s.trim()).filter(Boolean)));
        formData.append('liveUrl', liveUrl);
        formData.append('githubUrl', githubUrl);
        formData.append('category', category);
        formData.append('featured', String(featured));
        formData.append('order', String(order));
        if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

        try {
            if (editingProject) {
                await projectsAPI.update(editingProject._id, formData);
                toast.success('Project updated!');
            } else {
                await projectsAPI.create(formData);
                toast.success('Project created!');
            }
            setShowModal(false);
            resetForm();
            fetchProjects();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            await projectsAPI.delete(id);
            toast.success('Project deleted!');
            fetchProjects();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your portfolio</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <HiOutlinePlus /> Add Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                    <HiOutlinePhotograph style={{ fontSize: 48, color: 'var(--neutral-600)', marginBottom: 16 }} />
                    <h3 style={{ color: 'var(--neutral-300)', marginBottom: 8 }}>No projects yet</h3>
                    <p style={{ color: 'var(--neutral-500)', marginBottom: 20 }}>Add your first project to showcase in your portfolio</p>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <HiOutlinePlus /> Add Project
                    </button>
                </div>
            ) : (
                <div className="project-grid">
                    {projects.map((project) => (
                        <div key={project._id} className="project-card">
                            {project.thumbnail ? (
                                <img src={project.thumbnail} alt={project.title} className="project-thumb" />
                            ) : (
                                <div className="project-thumb-placeholder">
                                    <HiOutlinePhotograph />
                                </div>
                            )}
                            <div className="project-card-body">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <h3>{project.title}</h3>
                                    {project.featured && <span className="badge badge-success">Featured</span>}
                                </div>
                                <p>{project.description}</p>
                                <div className="project-card-tech">
                                    {project.techStack.map((tech, i) => (
                                        <span key={i} className="tech-chip">{tech}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="project-card-footer">
                                {project.liveUrl && (
                                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn-icon">
                                        <HiOutlineExternalLink />
                                    </a>
                                )}
                                <button className="btn-icon" onClick={() => openEditModal(project)}>
                                    <HiOutlinePencil />
                                </button>
                                <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(project._id)}>
                                    <HiOutlineTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Project Title</label>
                                    <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="My Awesome Project" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe your project..." />
                                </div>
                                <div className="form-group">
                                    <label>Tech Stack (comma separated)</label>
                                    <input className="form-input" value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, Node.js, MongoDB" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label>Live URL</label>
                                        <input className="form-input" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." />
                                    </div>
                                    <div className="form-group">
                                        <label>GitHub URL</label>
                                        <input className="form-input" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Web App" />
                                    </div>
                                    <div className="form-group">
                                        <label>Order</label>
                                        <input className="form-input" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                                            Featured
                                        </label>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Thumbnail</label>
                                    <div className="file-drop-zone" onClick={() => document.getElementById('thumb-input')?.click()}>
                                        <HiOutlinePhotograph style={{ fontSize: 32, color: 'var(--neutral-500)' }} />
                                        <p>Click to upload image</p>
                                    </div>
                                    <input id="thumb-input" type="file" accept="image/*" hidden onChange={handleFileChange} />
                                    {thumbnailPreview && (
                                        <div className="file-preview">
                                            <img src={thumbnailPreview} alt="preview" />
                                            <span style={{ fontSize: 13, color: 'var(--neutral-300)' }}>
                                                {thumbnailFile ? thumbnailFile.name : 'Current thumbnail'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editingProject ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;
