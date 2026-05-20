
'use client'

import { Trash2, GripVertical, FileText, Plus } from 'lucide-react'
import { ContentCard } from '@/app/page'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ContentCardsProps {
  cards: ContentCard[]
  onDeleteCard: (cardId: string) => void
}

interface SortableCardProps {
  card: ContentCard
  onDelete: (id: string) => void
}

function SortableCard({ card, onDelete }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `card-${card.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-background border border-border rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:border-primary/30 ${isDragging ? 'rotate-2 scale-105 border-primary shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle (visible on hover) */}
        <div
          className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Card content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-2 line-clamp-2">
            {card.title}
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
            {card.content}
          </p>
          <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between">
            <span>
              {card.createdAt.toLocaleDateString()} at{' '}
              {card.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {card.content.length} chars
            </span>
          </div>
        </div>

        {/* Delete button (visible on hover) */}
        <button
          onClick={() => onDelete(card.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 hover:text-destructive rounded"
          title="Delete card"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ContentCards({ cards, onDeleteCard }: ContentCardsProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'content-cards-droppable',
  });

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Content Cards
          <span className="text-sm font-normal text-muted-foreground">({cards.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Saved AI responses for later reference
        </p>
      </div>

      {/* Drop zone and card list */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-4 transition-all duration-200 ${isOver
            ? 'bg-primary/5 border-2 border-dashed border-primary/50'
            : 'scrollbar-thin scrollbar-thumb-border scrollbar-track-card'
          }`}
      >
        {/* Empty state */}
        {cards.length === 0 && !isOver && (
          <div className="text-center text-muted-foreground py-12">
            <div className="mb-4">
              <FileText className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-lg mb-2">No saved content yet</p>
            <p className="text-sm">
              Drag AI responses from the chat to save them as content cards
            </p>
          </div>
        )}

        {/* Active drop zone indicator */}
        {isOver && (
          <div className="text-center text-primary py-12 pointer-events-none">
            <div className="mb-4">
              <Plus className="h-12 w-12 mx-auto animate-bounce" />
            </div>
            <p className="text-lg font-medium mb-2">Drop here to create a content card</p>
            <p className="text-sm opacity-80">
              The AI response will be saved for later reference
            </p>
          </div>
        )}

        {/* Cards list */}
        <SortableContext
          items={cards.map(c => `card-${c.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {cards.map((card) => (
              <SortableCard key={card.id} card={card} onDelete={onDeleteCard} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
