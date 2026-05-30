import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_refined_architecture():
    # 1. Setup Canvas with a soft background color
    fig, ax = plt.subplots(figsize=(26, 16))
    fig.patch.set_facecolor('#f8f9fa')  # Light gray background
    ax.set_xlim(0, 120)
    ax.set_ylim(0, 105)
    ax.axis('off')
    
    # Main Blueprint Title
    plt.title("Vaartav Web Application - System Architecture Blueprint", 
              fontsize=28, fontweight='heavy', pad=40, color="#1a1a1a")

    # ==========================================
    # HELPER FUNCTIONS FOR PREMIUM STYLING
    # ==========================================
    
    def draw_shadow_box(x, y, w, h):
        """Draws a subtle drop shadow behind modules"""
        ax.add_patch(patches.FancyBboxPatch((x+0.6, y-0.6), w, h, boxstyle="round,pad=1.2", facecolor='#000000', alpha=0.15, edgecolor='none'))

    def draw_zone(x, y, w, h, title, bg_color, border_color):
        """Draws the large background boundary zones"""
        ax.add_patch(patches.Rectangle((x, y), w, h, fill=True, facecolor=bg_color, alpha=0.4, edgecolor=border_color, lw=3, linestyle='dashdot'))
        # Zone Title Badge
        ax.add_patch(patches.FancyBboxPatch((x + 1, y + h - 2), 22, 3, boxstyle="round,pad=0.5", facecolor=border_color, edgecolor='none'))
        ax.text(x + 12, y + h - 0.5, title, fontsize=14, fontweight='bold', color='white', ha='center', va='center')

    def draw_module(x, y, w, h, title, items, bg_color, text_color='white'):
        """Draws a detailed module block with a title and bulleted files"""
        draw_shadow_box(x, y, w, h)
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=1.2", facecolor=bg_color, edgecolor='#2d3748', lw=2))
        
        # Module Title
        ax.text(x + w/2, y + h - 1.5, title, color=text_color, weight='heavy', fontsize=12, ha='center', va='top')
        
        # Separator Line
        ax.plot([x + 2, x + w - 2], [y + h - 3.5, y + h - 3.5], color=text_color, alpha=0.4, lw=1.5)
        
        # Internal Files/List
        body_text = "\n".join([f"• {item}" for item in items])
        ax.text(x + 2, y + h/2 - 2, body_text, color=text_color, fontsize=11, ha='left', va='center', linespacing=1.8, weight='medium')

    def draw_flow(x1, y1, x2, y2, label, color, rad=0.0):
        """Draws thick routing arrows with framed text badges"""
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=3.5, connectionstyle=f"arc3,rad={rad}"))
        
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if rad != 0: my += (rad * 20)  # Adjust text position for curved arrows
        
        # Framer Badge for label
        ax.text(mx, my, label, fontsize=11, color='#1a1a1a', fontweight='bold', ha='center', va='center',
                bbox=dict(boxstyle="round,pad=0.4", facecolor='#ffffff', edgecolor=color, alpha=1.0, lw=2))

    # ==========================================
    # 1. HLD ZONES (The Background Areas)
    # ==========================================
    draw_zone(2, 5, 34, 92, "🖥️ Client Layer (Frontend)", "#e8f0fe", "#1a73e8")
    draw_zone(40, 58, 38, 39, "⚙️ Core API & Serverless", "#e6f4ea", "#1e8e3e")
    draw_zone(40, 5, 38, 48, "⚡ Real-Time Engine", "#fef7e0", "#f9ab00")
    draw_zone(82, 5, 36, 92, "🗄️ External Services & Data", "#fce8e6", "#d93025")

    # ==========================================
    # 2. LLD MODULES (Your Specific Codebase Files)
    # ==========================================
    
    # -- Zone 1: Client --
    draw_module(5, 76, 28, 14, "App Router Pages", 
                ["app/page.tsx (Landing)", "app/(auth)/login & signup", "app/meeting/[meetingCode]"], "#1557b0")
    
    draw_module(5, 54, 28, 16, "UI & 3D Components", 
                ["components/3d/HeroGeometric.tsx", "components/ActualVideoRoom.tsx", "Tailwind + Framer Motion"], "#1a73e8")
    
    draw_module(5, 34, 28, 14, "Context Providers", 
                ["components/Providers.tsx", "components/SocketProvider.tsx", "components/ThemeProvider.tsx"], "#4285f4")
    
    draw_module(5, 12, 28, 14, "LiveKit Client SDK", 
                ["@livekit/components-react", "Audio/Video Track Processors", "components/LiveKitVideoRoom.tsx"], "#8ab4f8", text_color="#111")

    # -- Zone 2: API Backend --
    draw_module(43, 80, 32, 12, "Authentication Routes", 
                ["app/api/auth/[...nextauth]/route.ts", "Session & JWT Management", "lib/auth.ts"], "#0d652d")
    
    draw_module(43, 62, 32, 12, "Core API Routes", 
                ["app/api/meetings/create", "app/api/livekit (Token Gen)", "app/api/end/route.ts"], "#1e8e3e")

    # -- Zone 3: Real-Time Engine --
    draw_module(43, 35, 32, 12, "Socket.io Server", 
                ["Express Node Server", "keepAlive.js", "Real-time bi-directional events"], "#e37400")
    
    draw_module(43, 12, 32, 15, "AI Agent Worker", 
                ["agent.py", "Vercel AI SDK Core (@ai-sdk/groq)", "Data Parsing & Insights"], "#f9ab00", text_color="#111")

    # -- Zone 4: External / DB --
    draw_module(86, 80, 28, 12, "Identity & Webhooks", 
                ["OAuth Providers (Google/Github)", "Svix Webhooks", "NextAuth Adapter"], "#a50e0e")
    
    draw_module(86, 58, 28, 14, "LiveKit Cloud", 
                ["WebRTC SFU Server", "livekit-server-sdk", "Video/Audio Routing"], "#d93025")
    
    draw_module(86, 35, 28, 12, "Groq AI Engine", 
                ["Fast LLM Inference", "Natural Language Processing", "Agent Tool Calling"], "#ea4335")
    
    draw_module(86, 12, 28, 15, "Database Layer", 
                ["Prisma ORM (schema.prisma)", "lib/db.ts Connection Pool", "Relational Database (SQL)"], "#f28b82", text_color="#111")

    # ==========================================
    # 3. DATA FLOWS (Relationships)
    # ==========================================
    
    # Client <-> API
    draw_flow(33, 86, 43, 86, "Login / JWT Session", "#1e8e3e")
    draw_flow(33, 68, 43, 68, "Fetch Tokens & Setup", "#1e8e3e")
    
    # Client <-> Real-Time
    draw_flow(33, 40, 43, 40, "Socket.io WebSockets", "#f9ab00", rad=0)
    
    # Client <-> External (WebRTC Bypass)
    draw_flow(33, 20, 86, 65, "Direct WebRTC Stream", "#d93025", rad=-0.15) 

    # API <-> External/DB
    draw_flow(75, 86, 86, 86, "Verify Identity Hook", "#d93025")
    draw_flow(75, 68, 86, 20, "Prisma Queries", "#a50e0e", rad=0.25)
    
    # Real-Time <-> External
    draw_flow(75, 40, 86, 40, "AI Prompts / JSON", "#d93025")
    draw_flow(75, 20, 86, 20, "Store Meeting Insights", "#a50e0e")

    # ==========================================
    # 4. EXPORT
    # ==========================================
    output_filename = "vaartav_premium_architecture.png"
    plt.tight_layout()
    plt.savefig(output_filename, dpi=400, bbox_inches='tight', facecolor=fig.get_facecolor())
    print(f"\n[Success] Premium Architecture Diagram Generated!\nSaved locally as: {output_filename}")

if __name__ == "__main__":
    draw_refined_architecture()