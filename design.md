ROLE: Lead Product Designer (Enterprise UX & Spatial Design)
1. THE OBJECTIVE: "FROSTED MINIMALISM"
CONTEXT: You are building a high-density CRM interface.
THE AESTHETIC: "Refined Glass." Think high-end architectural glass, not video game neon.
Keywords: Crystalline, Editorial, Dense, Muted, Tactile.
The Goal: A workspace that feels expensive and airy.
The Trap (AI Slop): Do NOT create a "Vibe Coded" dashboard with random purple blobs, illegible text over blurry backgrounds, or giant empty cards.
2. STRICT VISUAL PROTOCOLS (The "Anti-Slop" Rules)
NO DECORATIVE BLUR: Do not put random blurred circles behind the text. Only use Glass (backdrop-filter) for structural elements like Sidebars, Sticky Headers, or Floating Modals.
NO RAINBOW GRADIENTS: The background should be subtle—Off-white, Soft Grey, or a very deep Charcoal. No "Aurora" gradients.
NO "DEFAULT DASHBOARD" WIDGETS: Do not create 4 giant cards that just say "Total Revenue." A Premium CRM shows dense lists, activity feeds, and contact rows.
NO GENERIC FONTS: You must use a "Classy" pairing.
Header: A sharp Serif (e.g., Playfair Display, Instrument Serif, Fraunces) to give it an "Editorial" feel.
Data: A technical Sans (e.g., Inter Tight, Geist, Satoshi).
3. PHASE 1: THE DESIGN SYSTEM (Mandatory Specs)
Before coding, establish the physics of the interface.
A. The "Glass" Recipe:
Don't just use bg-white/10.
The Premium Formula: bg-white/70 (or black/40 for dark mode) + backdrop-blur-xl + A fine 1px border (border-white/20) + A subtle inner shadow.
Why? This creates a physical "sheet of glass" look, not just a blur.
B. Typography Strategy (The "Classy" Factor):
Use the Serif font for Context (Page Titles, Section Headers).
Use the Sans font for Content (Data tables, inputs, buttons).
Rule: High contrast. Headers are dark/heavy. Labels are muted/small (text-xs uppercase tracking-widest).
C. The Shape Language:
Radius: Consistent rounded-2xl (16px) for containers, rounded-lg (8px) for inner elements.
Spacing: Strict 4pt grid. CRMs need density. Do not use massive padding. Use gap-2 or gap-4 to keep data tight but breathable.
4. PHASE 2: COMPONENT ARCHITECTURE
Map the CRM features to these high-end layouts:
The Sidebar (Glass):
Fixed, full height. Frosted glass effect.
Navigation items should be simple text or high-fidelity icons (Phosphor/Heroicons), styled with text-stone-500 turning text-black on hover.
The "Command" Header:
A floating glass bar at the top (not full width). Contains Search ("Command+K") and User Profile.
Must feel detached and floating above the content.
The Data Table (Minimal):
No vertical borders. Only subtle horizontal dividers (border-stone-200).
Row Hover: A very subtle color shift (bg-stone-500/5).
Status Pills: refined, pastel colors (e.g., bg-emerald-100 text-emerald-800), not neon.
The "Entity" Card:
When viewing a Contact/Deal: Use a split layout. Serif name at the top. Tabs for "Activity," "Emails," "Files."
5. PHASE 3: EXECUTION (React + Tailwind + Framer Motion)
Texture: Add a barely visible "Noise" overlay (opacity-50 mix-blend-overlay) to the background to kill the "plastic" AI look.
Motion:
Micro-Interactions: Buttons scale down (scale-95) on click.
Modals: Slide up from the bottom with a spring physics (stiff, no bounce).
Code Structure: Use div layers carefully to ensure the backdrop-filter actually works (needs content behind it to blur).
6. DELIVERABLE
Part 1: The Design Spec
Vibe: [e.g., "Architectural Minimalism"]
Font Pairing: [Serif Name] + [Sans Name]
Glass Opacity Strategy: [e.g., "High frost, low transparency"]
Part 2: The Code
A single React file.
Crucial: Define the custom fonts via @import in the style tag.
Crucial: Implement the noise texture and glass classes correctly.