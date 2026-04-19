import { ChatWidget } from "@/components/chat-widget";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
