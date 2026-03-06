import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, MessageCircle, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type UserInfo = {
  id: number;
  name: string;
  role: string;
  email?: string;
};

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  isRead: string;
  createdAt: string;
};

type ConversationPartner = {
  user: UserInfo;
  lastMessage: Message;
};

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(selectedUser.id), 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [convos, users] = await Promise.all([
        api.get("/api/messages/conversations"),
        api.get("/api/messages/users"),
      ]);
      setConversations(convos);
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to load chat data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(userId: number) {
    try {
      const msgs = await api.get(`/api/messages/${userId}`);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedUser || sending) return;
    setSending(true);
    try {
      const msg = await api.post("/api/messages", {
        receiverId: selectedUser.id,
        message: newMessage.trim(),
      });
      setMessages(prev => [...prev, msg]);
      setNewMessage("");
      fetchData();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  function selectUser(u: UserInfo) {
    setSelectedUser(u);
    setShowUserList(false);
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  }

  function getRoleBadge(role: string) {
    if (role === "super_admin") return "Super Admin";
    if (role === "admin") return "Admin";
    return "Employee";
  }

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const existingPartnerIds = new Set(conversations.map(c => c.user.id));
  const newUsers = filteredUsers.filter(u => !existingPartnerIds.has(u.id));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]" data-testid="chat-loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Messages</h1>
            <p className="text-muted-foreground">Chat with your team members.</p>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          <Card className="w-80 shrink-0 flex flex-col" data-testid="chat-sidebar">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            <div className="p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => setShowUserList(!showUserList)}
                data-testid="button-new-chat"
              >
                <Users className="mr-2 h-4 w-4" />
                {showUserList ? "Show Conversations" : "Start New Chat"}
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {showUserList ? (
                <div className="p-2 space-y-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                  ) : (
                    filteredUsers.map(u => (
                      <button
                        key={u.id}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50",
                          selectedUser?.id === u.id && "bg-primary/5 border border-primary/20"
                        )}
                        onClick={() => selectUser(u)}
                        data-testid={`user-item-${u.id}`}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{u.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 h-4 mt-0.5">
                            {getRoleBadge(u.role)}
                          </Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.length === 0 && newUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                      <Button variant="link" size="sm" onClick={() => setShowUserList(true)} className="mt-1">
                        Start a new chat
                      </Button>
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.user.id}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50",
                          selectedUser?.id === conv.user.id && "bg-primary/5 border border-primary/20"
                        )}
                        onClick={() => selectUser(conv.user)}
                        data-testid={`conversation-item-${conv.user.id}`}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getInitials(conv.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate">{conv.user.name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {conv.lastMessage.createdAt && format(new Date(conv.lastMessage.createdAt), "MMM d")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.lastMessage.senderId === user?.id ? "You: " : ""}
                            {conv.lastMessage.message}
                          </p>
                        </div>
                        {conv.lastMessage.receiverId === user?.id && conv.lastMessage.isRead === "false" && (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </Card>

          <Card className="flex-1 flex flex-col min-w-0" data-testid="chat-main">
            {selectedUser ? (
              <>
                <div className="p-4 border-b flex items-center gap-3 shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm" data-testid="text-chat-partner-name">{selectedUser.name}</h3>
                    <Badge variant="outline" className="text-[10px] px-1.5 h-4">
                      {getRoleBadge(selectedUser.role)}
                    </Badge>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                        <p className="text-sm text-muted-foreground">No messages yet. Send the first one!</p>
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isMine = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn("flex", isMine ? "justify-end" : "justify-start")}
                            data-testid={`message-${msg.id}`}
                          >
                            <div className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2.5",
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              <p className={cn(
                                "text-[10px] mt-1",
                                isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                              )}>
                                {msg.createdAt && format(new Date(msg.createdAt), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t shrink-0">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      data-testid="input-message"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                      data-testid="button-send-message"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/15 mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground/60">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground/40 mt-1">Choose a team member to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
