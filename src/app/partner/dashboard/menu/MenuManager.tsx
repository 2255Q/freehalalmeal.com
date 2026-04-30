'use client';

import { useState, useTransition } from 'react';
import type { MenuItem } from '@/lib/types';
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItem,
  toggleMenuItemActive,
} from '@/app/partner/actions';

export function MenuManager({ items }: { items: MenuItem[] }) {
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-4xl text-ink-900">Menu items</h1>
          <p className="mt-2 text-ink-600">
            The dishes you&rsquo;re offering free. Reorder them to control how they appear publicly.
          </p>
        </div>
        <button onClick={() => { setCreating(true); setEditing(null); }} className="btn-primary">
          + Add menu item
        </button>
      </header>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink-700">No menu items yet.</p>
          <button onClick={() => setCreating(true)} className="mt-4 btn-primary">
            Add your first dish
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {items.map((item, idx) => (
            <MenuRow
              key={item.id}
              item={item}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              onEdit={() => { setEditing(item); setCreating(false); }}
            />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <MenuItemModal
          item={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function MenuRow({
  item,
  isFirst,
  isLast,
  onEdit,
}: {
  item: MenuItem;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function reorder(direction: 'up' | 'down') {
    const fd = new FormData();
    fd.set('id', item.id);
    fd.set('direction', direction);
    startTransition(async () => {
      await reorderMenuItem(fd);
    });
  }

  function toggle() {
    const fd = new FormData();
    fd.set('id', item.id);
    fd.set('is_active', String(!item.is_active));
    startTransition(async () => {
      await toggleMenuItemActive(fd);
    });
  }

  function onDelete() {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    const fd = new FormData();
    fd.set('id', item.id);
    startTransition(async () => {
      await deleteMenuItem(fd);
    });
  }

  return (
    <div className={`p-5 flex items-center gap-4 ${!item.is_active ? 'opacity-60' : ''}`}>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => reorder('up')}
          disabled={pending || isFirst}
          className="text-ink-400 hover:text-ink-700 disabled:opacity-30 disabled:hover:text-ink-400 p-1"
          aria-label="Move up"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
        </button>
        <button
          type="button"
          onClick={() => reorder('down')}
          disabled={pending || isLast}
          className="text-ink-400 hover:text-ink-700 disabled:opacity-30 disabled:hover:text-ink-400 p-1"
          aria-label="Move down"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
        </button>
      </div>

      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name}
          className="h-16 w-16 rounded-xl object-cover bg-ink-100"
        />
      ) : (
        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75 7.409 9.43a2.25 2.25 0 0 1 3.182 0l3.4 3.4M14.25 13.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M5.25 6h.008v.008H5.25V6Zm15 12.75H3.75A2.25 2.25 0 0 1 1.5 16.5V5.25a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 5.25v11.25a2.25 2.25 0 0 1-2.25 2.25Z" /></svg>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-lg text-ink-900">{item.name}</h3>
          {!item.is_active && <span className="badge bg-ink-100 text-ink-600">inactive</span>}
        </div>
        {item.description && (
          <p className="text-sm text-ink-600 mt-0.5 line-clamp-2">{item.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onEdit} disabled={pending} className="btn-outline text-xs px-3 py-1.5">Edit</button>
        <button onClick={toggle} disabled={pending} className="btn-outline text-xs px-3 py-1.5">
          {item.is_active ? 'Hide' : 'Show'}
        </button>
        <button onClick={onDelete} disabled={pending} className="btn-outline text-xs px-3 py-1.5 text-red-700 border-red-200 hover:bg-red-50">
          Delete
        </button>
      </div>
    </div>
  );
}

function MenuItemModal({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState(item?.image_url ?? '');
  const isEdit = !!item;

  function onSubmit(formData: FormData) {
    setError(null);
    if (isEdit) formData.set('id', item!.id);
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateMenuItem(formData);
        } else {
          await createMenuItem(formData);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-lift max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink-900">
            {isEdit ? 'Edit menu item' : 'Add menu item'}
          </h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 p-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form action={onSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Meal name</label>
            <input name="name" required defaultValue={item?.name ?? ''} className="input" placeholder="e.g. Lentil Soup" />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea name="description" rows={3} defaultValue={item?.description ?? ''} className="input" />
          </div>

          <div>
            <label className="label">Image URL (optional)</label>
            <input
              name="image_url"
              defaultValue={item?.image_url ?? ''}
              onChange={(e) => setImagePreview(e.target.value)}
              placeholder="https://"
              className="input"
            />
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="preview"
                className="mt-3 h-32 w-32 rounded-xl object-cover border border-ink-100"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          <input type="hidden" name="_has_is_active" value="1" />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={item?.is_active ?? true}
              value="on"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Show this item on the public page
          </label>

          <div className="pt-4 border-t border-ink-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
