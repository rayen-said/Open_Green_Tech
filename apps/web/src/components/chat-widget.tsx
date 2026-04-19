"use client";

import { useI18n } from "@/i18n/provider";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { Bot, MessageCircle, SendHorizonal, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatMessageResponse = {
  assistant: ChatMessage;
  history: ChatMessage[];
};

const DEMO_QUESTION_KEYS = ["chat.samples.plant", "chat.samples.humidity", "chat.samples.navigation"];

export function ChatWidget() {
  const { token, user, hydrated } = useAuthStore();
  const { t, lang, dir } = useI18n();
  const pushToast = useToastStore((state) => state.pushToast);
  const [open, setOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const demoQuestions = useMemo(() => DEMO_QUESTION_KEYS.map((key) => t(key)), [t]);

  useEffect(() => {
    if (!open || !token || historyLoaded) {
      return;
    }

    setLoadingHistory(true);
    void api
      .get<ChatMessage[]>("/chat/history?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setMessages(response.data);
        setHistoryLoaded(true);
      })
      .catch(() => {
        pushToast({ variant: "error", message: t("chat.errors.history") });
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [open, token, historyLoaded, pushToast, t]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, sending]);

  const onSend = async (value?: string) => {
    if (!token) {
      return;
    }

    const prompt = (value ?? input).trim();
    if (!prompt) {
      return;
    }

    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await api.post<ChatMessageResponse>(
        "/chat/message",
        {
          prompt,
          language: lang,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setMessages(response.data.history);
    } catch (error: unknown) {
      const maybeStatus = (error as { response?: { status?: number } })?.response?.status;
      if (maybeStatus === 429) {
        pushToast({ variant: "warn", message: t("chat.errors.rate") });
      } else {
        pushToast({ variant: "error", message: t("chat.errors.send") });
      }
      setMessages((prev) => prev.filter((item) => item.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  if (!hydrated || !user || !token) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("chat.title")}
      >
        <MessageCircle size={18} />
        <span>{t("chat.fab")}</span>
      </button>

      {open ? (
        <section className="chat-panel" dir={dir}>
          <header className="chat-header">
            <div>
              <strong>{t("chat.title")}</strong>
              <small>{t("chat.subtitle")}</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("chat.close")}>
              <X size={16} />
            </button>
          </header>

          <div className="chat-demo-questions">
            <span>
              <Sparkles size={14} /> {t("chat.quickPrompt")}
            </span>
            <div>
              {demoQuestions.map((question) => (
                <button key={question} type="button" onClick={() => void onSend(question)}>
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {loadingHistory ? <p className="chat-empty">{t("chat.loading")}</p> : null}
            {!loadingHistory && messages.length === 0 ? <p className="chat-empty">{t("chat.empty")}</p> : null}

            {messages.map((message) => (
              <article key={message.id} className={`chat-message ${message.role === "assistant" ? "assistant" : "user"}`}>
                <div className="chat-avatar">{message.role === "assistant" ? <Bot size={14} /> : "U"}</div>
                <div className="chat-bubble">
                  <p>{message.content}</p>
                  <time>{new Date(message.createdAt).toLocaleTimeString()}</time>
                </div>
              </article>
            ))}

            {sending ? (
              <article className="chat-message assistant">
                <div className="chat-avatar">
                  <Bot size={14} />
                </div>
                <div className="chat-bubble typing">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            ) : null}
          </div>

          <form
            className="chat-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              void onSend();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("chat.placeholder")}
              maxLength={1200}
            />
            <button type="submit" disabled={sending || input.trim().length === 0}>
              <SendHorizonal size={15} />
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
