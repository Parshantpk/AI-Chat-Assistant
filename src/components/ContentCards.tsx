/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useRef } from 'react'
import { Trash2, GripVertical, FileText, Plus } from 'lucide-react'
import { ContentCard } from '@/app/page'

interface ContentCardsProps {
  cards: ContentCard[]
  onDeleteCard: (cardId: string) => void
  onReorderCards: (newCards: ContentCard[]) => void
  onCreateCardFromDrop?: (messageId: string) => void
}

export function ContentCards({ cards, onDeleteCard, onReorderCards, onCreateCardFromDrop }: ContentCardsProps) {
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [draggedOverCard, setDraggedOverCard] = useState<string | null>(null)
  const [isDropZoneActive, setIsDropZoneActive] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Handle dragging over the drop zone from external sources (e.g., messages)
  const handleExternalDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.dataTransfer.types.includes('application/card-reorder')) {
      e.dataTransfer.dropEffect = 'copy'
      setIsDropZoneActive(true)
    }
  }

  // Handle leaving the external drag zone
  const handleExternalDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('application/card-reorder')) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDropZoneActive(false)
      }
    }
  }

  // Handle drop from external source (e.g., drag from chat)
  const handleExternalDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.dataTransfer.types.includes('application/card-reorder')) {
      setIsDropZoneActive(false)
      const messageId = e.dataTransfer.getData('text/plain')
      if (messageId && onCreateCardFromDrop) {
        onCreateCardFromDrop(messageId)
      }
    }
  }

  // Card drag start (internal reorder)
  const handleCardDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId)
    e.dataTransfer.setData('application/card-reorder', cardId)
    e.dataTransfer.effectAllowed = 'move'
    const element = e.currentTarget as HTMLElement
    element.style.opacity = '0.5'
  }

  // Card drag end (cleanup state)
  const handleCardDragEnd = (e: React.DragEvent) => {
    setDraggedCard(null)
    setDraggedOverCard(null)
    const element = e.currentTarget as HTMLElement
    element.style.opacity = '1'
  }

  // Card drag over another card (for reordering)
  const handleCardDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('application/card-reorder')) {
      e.dataTransfer.dropEffect = 'move'
      setDraggedOverCard(cardId)
      setIsDropZoneActive(false)
    }
  }

  // Handle leaving drag area of a card
  const handleCardDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedOverCard(null)
    }
  }

  // Handle drop on a card to reorder
  const handleCardDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverCard(null)
    const draggedCardId = e.dataTransfer.getData('application/card-reorder')
    if (!draggedCardId || draggedCardId === targetCardId) return

    const draggedIndex = cards.findIndex(card => card.id === draggedCardId)
    const targetIndex = cards.findIndex(card => card.id === targetCardId)
    if (draggedIndex === -1 || targetIndex === -1) return

    const newCards = [...cards]
    const [draggedCard] = newCards.splice(draggedIndex, 1)
    newCards.splice(targetIndex, 0, draggedCard)
    onReorderCards(newCards)
  }

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
        ref={dropZoneRef}
        className={`flex-1 overflow-y-auto p-4 transition-all duration-200 ${isDropZoneActive
            ? 'bg-primary/5 border-2 border-dashed border-primary/50'
            : 'scrollbar-thin scrollbar-thumb-border scrollbar-track-card'
          }`}
        onDragOver={handleExternalDragOver}
        onDragLeave={handleExternalDragLeave}
        onDrop={handleExternalDrop}
      >
        {/* Empty state */}
        {cards.length === 0 && !isDropZoneActive && (
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
        {isDropZoneActive && (
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
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`group relative bg-background border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md hover:border-primary/30 ${draggedOverCard === card.id ? 'border-primary border-2' : ''
                } ${draggedCard === card.id ? 'rotate-2 scale-105' : ''}`}
              draggable
              onDragStart={(e) => handleCardDragStart(e, card.id)}
              onDragEnd={handleCardDragEnd}
              onDragOver={(e) => handleCardDragOver(e, card.id)}
              onDragLeave={handleCardDragLeave}
              onDrop={(e) => handleCardDrop(e, card.id)}
            >
              <div className="flex items-start gap-3">
                {/* Drag handle (visible on hover) */}
                <div className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-50 transition-opacity">
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
                  onClick={() => onDeleteCard(card.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 hover:text-destructive rounded"
                  title="Delete card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}