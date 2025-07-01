/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ChatInterface } from "@/components/ChatInterFace";
import { ContentCards } from "@/components/ContentCards";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useEffect, useState } from "react";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Interfaces
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface ContentCard {
  id: string;
  content: string;
  title: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tempConversation, setTempConversation] = useState<{ id: string; messages: Message[] } | null>(null);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  // Decide which messages to show: temp or saved
  const messages =
    tempConversation && tempConversation.id === currentConversationId
      ? tempConversation.messages
      : currentConversation?.messages || [];

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Handle sending new messages (user or assistant)
  const addMessage = (
    message: Omit<Message, "id" | "timestamp">,
    targetConversationId?: string
  ) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    let conversationIdToUse = targetConversationId || currentConversationId;

    // If no conversation exists yet, create a new one
    if (!conversationIdToUse) {
      const newConversationId = crypto.randomUUID();
      conversationIdToUse = newConversationId;
      setCurrentConversationId(newConversationId);

      // Temporarily store user message before assistant replies
      if (message.role === "user") {
        setTempConversation({
          id: newConversationId,
          messages: [newMessage],
        });
      } else {
        const newConversation: Conversation = {
          id: newConversationId,
          title: "New Conversation",
          messages: [newMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations((prev) => [newConversation, ...prev]);
      }

      return { messageId: newMessage.id, conversationId: conversationIdToUse };
    }

    // If working with a temporary conversation
    if (tempConversation && conversationIdToUse === tempConversation.id) {
      const updatedMessages = [...tempConversation.messages, newMessage];

      if (message.role === "assistant") {
        const firstUserMessage = updatedMessages.find(m => m.role === "user");
        const titleContent = firstUserMessage ? firstUserMessage.content : "New Conversation";

        const newConversation: Conversation = {
          id: tempConversation.id,
          title: generateConversationTitle(titleContent),
          messages: updatedMessages,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setConversations((prev) => [newConversation, ...prev]);
        setTempConversation(null);
      } else {
        setTempConversation((prev) =>
          prev ? { ...prev, messages: updatedMessages } : null
        );
      }

      return { messageId: newMessage.id, conversationId: conversationIdToUse };
    }

    // Add message to an existing conversation
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationIdToUse
          ? {
            ...conv,
            messages: [...conv.messages, newMessage],
            updatedAt: new Date(),
          }
          : conv
      )
    );

    // Auto-generate a title from the first user message if it's still default
    if (message.role === "assistant") {
      const conversation = conversations.find(c => c.id === conversationIdToUse);
      if (conversation && conversation.title === "New Conversation") {
        const firstUserMessage = conversation.messages.find(m => m.role === "user");
        if (firstUserMessage) {
          updateConversationTitle(conversationIdToUse, firstUserMessage.content);
        }
      }
    }

    return { messageId: newMessage.id, conversationId: conversationIdToUse };
  };

  // Update conversation title using first user message
  const updateConversationTitle = (
    conversationId: string,
    userMessage: string
  ) => {
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId && conv.title === "New Conversation"
            ? { ...conv, title: generateConversationTitle(userMessage) }
            : conv
        )
      );
    }, 100);
  };

  // Create a brand new conversation
  const createNewConversation = (initialMessages: Message[] = []) => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "New Conversation",
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setTempConversation(null);
  };

  // Generate a short, clean conversation title
  const generateConversationTitle = (content: string): string => {
    const cleanContent = content.replace(/[\r\n\t]/g, " ").trim();
    if (!cleanContent) return "New Conversation";

    const words = cleanContent.split(" ").filter((word) => word.length > 0);
    let title = words.slice(0, 6).join(" ");

    if (title.length > 40) {
      title = cleanContent.substring(0, 40);
    }

    return title.length < cleanContent.length ? title + "..." : title;
  };

  // Delete a conversation and switch to another if needed
  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => {
      const newConversations = prev.filter((c) => c.id !== conversationId);

      if (currentConversationId === conversationId) {
        setCurrentConversationId(newConversations.length > 0 ? newConversations[0].id : null);
        setTempConversation(null);
      }

      return newConversations;
    });
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setTempConversation(null);
  };

  // Convert assistant message to a content card
  const createCard = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.role !== "assistant") return;

    const existingCard = cards.find((card) => card.content === message.content);
    if (existingCard) return;

    const newCard: ContentCard = {
      id: crypto.randomUUID(),
      content: message.content,
      title: message.content.substring(0, 50) + (message.content.length > 50 ? "..." : ""),
      createdAt: new Date(),
    };

    setCards((prev) => [newCard, ...prev]);
  };

  const deleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const reorderCards = (newCards: ContentCard[]) => {
    setCards(newCards);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background text-foreground flex">
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectConversation={selectConversation}
          onNewConversation={() => createNewConversation()}
          onDeleteConversation={deleteConversation}
        />

        <div className="flex-1 flex flex-col">
          <header className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">AI Content Assistant</h1>
            </div>
          </header>

          <main className="flex-1 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
              <div className="flex flex-col">
                <ChatInterface
                  messages={messages}
                  onAddMessage={addMessage}
                  onCreateCard={createCard}
                  onUpdateTitle={updateConversationTitle}
                  conversationTitle={
                    currentConversation?.title ||
                    (tempConversation ? "New Conversation" : "New Conversation")
                  }
                  hasActiveConversation={!!currentConversationId}
                  disabled={!currentConversationId}
                />
              </div>

              <div className="h-[calc(110vh-200px)] flex flex-col">
                <ContentCards
                  cards={cards}
                  onDeleteCard={deleteCard}
                  onReorderCards={reorderCards}
                  onCreateCardFromDrop={createCard}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </DndProvider>
  );
}