import { Project, ProjectFile, ProjectTemplateType } from "../types";

export const getFileLanguage = (filename: string): ProjectFile["language"] => {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "js":
    case "mjs":
      return "javascript";
    case "ts":
      return "typescript";
    case "jsx":
      return "jsx";
    case "tsx":
      return "tsx";
    case "json":
      return "json";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
};

export const createDefaultFile = (
  name: string,
  path: string,
  content: string,
  isEntry: boolean = false
): ProjectFile => ({
  id: `file_${Math.random().toString(36).slice(2, 9)}`,
  name,
  path,
  content,
  language: getFileLanguage(name),
  isFolder: false,
  updatedAt: new Date().toISOString(),
  isEntry,
});

export const createDefaultFolder = (name: string, path: string): ProjectFile => ({
  id: `folder_${Math.random().toString(36).slice(2, 9)}`,
  name,
  path,
  content: "",
  language: "plaintext",
  isFolder: true,
  updatedAt: new Date().toISOString(),
});

export const TEMPLATES: Record<
  ProjectTemplateType,
  { name: string; description: string; files: ProjectFile[] }
> = {
  portfolio: {
    name: "Nexora Demo Website",
    description: "Modern responsive portfolio with hero, interactive projects showcase, skills matrix, and contact form.",
    files: [
      createDefaultFile(
        "index.html",
        "index.html",
        `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Rivera | Creative Full-Stack Engineer</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white min-h-screen">

  <!-- Navbar -->
  <header class="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <a href="#hero" class="flex items-center gap-2 font-bold text-lg tracking-tight">
        <span class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">⚡</span>
        <span>Alex<span class="text-indigo-400">.dev</span></span>
      </a>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#about" class="hover:text-indigo-400 transition-colors">About</a>
        <a href="#projects" class="hover:text-indigo-400 transition-colors">Projects</a>
        <a href="#skills" class="hover:text-indigo-400 transition-colors">Skills</a>
        <a href="#contact" class="hover:text-indigo-400 transition-colors">Contact</a>
      </nav>
      <div class="flex items-center gap-3">
        <a href="#contact" class="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20">
          Get in Touch
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section id="hero" class="relative overflow-hidden py-24 md:py-32 px-6">
    <div class="max-w-4xl mx-auto text-center relative z-10">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-medium mb-6">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Available for freelance & full-time roles
      </div>
      <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none mb-6">
        Crafting modern <span class="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">web experiences</span> that perform.
      </h1>
      <p class="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        I am a senior frontend architect specializing in reactive user interfaces, high-throughput microfrontends, and mobile-first experiences.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <a href="#projects" class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/30">
          Explore Projects
        </a>
        <button id="resumeBtn" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium transition-all">
          View Credentials
        </button>
      </div>
    </div>
  </section>

  <!-- Projects Section -->
  <section id="projects" class="py-20 px-6 max-w-6xl mx-auto border-t border-slate-800/60">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
      <div>
        <h2 class="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-2">Portfolio</h2>
        <p class="text-3xl font-bold tracking-tight">Featured Engineering Works</p>
      </div>
      <!-- Filter Tags -->
      <div class="flex gap-2" id="projectFilter">
        <button data-filter="all" class="filter-btn active px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white">All</button>
        <button data-filter="web" class="filter-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700">Web</button>
        <button data-filter="ai" class="filter-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700">AI / Cloud</button>
      </div>
    </div>

    <!-- Dynamic Projects Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projectsGrid">
      <!-- Injected via JavaScript -->
    </div>
  </section>

  <!-- Skills Matrix -->
  <section id="skills" class="py-20 px-6 max-w-6xl mx-auto border-t border-slate-800/60">
    <div class="text-center max-w-2xl mx-auto mb-12">
      <h2 class="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-2">Capabilities</h2>
      <p class="text-3xl font-bold tracking-tight">Modern Tech Stack</p>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors">
        <div class="text-2xl mb-2">⚛️</div>
        <div class="font-semibold text-sm">React 19</div>
        <div class="text-xs text-slate-400">Frontend</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors">
        <div class="text-2xl mb-2">🟦</div>
        <div class="font-semibold text-sm">TypeScript</div>
        <div class="text-xs text-slate-400">Language</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors">
        <div class="text-2xl mb-2">🌊</div>
        <div class="font-semibold text-sm">Tailwind CSS</div>
        <div class="text-xs text-slate-400">Styling</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors">
        <div class="text-2xl mb-2">⚡</div>
        <div class="font-semibold text-sm">Node / Express</div>
        <div class="text-xs text-slate-400">Backend</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors">
        <div class="text-2xl mb-2">⚡</div>
        <div class="font-semibold text-sm">Supabase</div>
        <div class="text-xs text-slate-400">Database</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors">
        <div class="text-2xl mb-2">📱</div>
        <div class="font-semibold text-sm">Capacitor</div>
        <div class="text-xs text-slate-400">Android / iOS</div>
      </div>
    </div>
  </section>

  <!-- Interactive Contact Section -->
  <section id="contact" class="py-20 px-6 max-w-3xl mx-auto border-t border-slate-800/60">
    <div class="text-center mb-10">
      <h2 class="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-2">Collaboration</h2>
      <p class="text-3xl font-bold tracking-tight">Let's Build Something Great</p>
    </div>
    <form id="contactForm" class="space-y-4 bg-slate-900 p-8 rounded-2xl border border-slate-800">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Your Name</label>
          <input type="text" id="nameInput" required placeholder="Jane Doe" class="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
          <input type="email" id="emailInput" required placeholder="jane@example.com" class="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-400 mb-1">Message</label>
        <textarea id="messageInput" rows="4" required placeholder="Tell me about your project scope or timeline..." class="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"></textarea>
      </div>
      <button type="submit" class="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20">
        Send Message
      </button>
      <div id="toastMessage" class="hidden text-center text-xs font-medium p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300">
        ✓ Message dispatched successfully! I will respond within 24 hours.
      </div>
    </form>
  </section>

  <!-- Footer -->
  <footer class="py-8 px-6 text-center text-xs text-slate-500 border-t border-slate-800/80">
    <p>© 2026 Alex Rivera. Built with Nexora Editor IDE.</p>
  </footer>

  <script src="script.js"></script>
</body>
</html>`,
        true
      ),
      createDefaultFile(
        "style.css",
        "style.css",
        `/* Custom styles for portfolio */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

.float-anim {
  animation: float 4s ease-in-out infinite;
}

.project-card {
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.4);
}`
      ),
      createDefaultFile(
        "script.js",
        "script.js",
        `// Portfolio Interactive Logic
const projects = [
  {
    title: "Nexora Studio",
    tag: "web",
    description: "Cloud-native web IDE with real-time compilation, Monaco integration, and live debugging.",
    metrics: "45k monthly active devs",
    tech: ["TypeScript", "Monaco", "Tailwind"]
  },
  {
    title: "Hyperion AI Vision",
    tag: "ai",
    description: "Neural edge vision engine for automated quality assurance on micro-robotics.",
    metrics: "99.4% inference accuracy",
    tech: ["Python", "TensorFlow", "FastAPI"]
  },
  {
    title: "Pulse Payments API",
    tag: "web",
    description: "High-concurrency global payment gateway settling sub-second multi-currency transfers.",
    metrics: "$2.4M volume processed",
    tech: ["Go", "PostgreSQL", "Kafka"]
  }
];

function renderProjects(filter = 'all') {
  const container = document.getElementById('projectsGrid');
  if (!container) return;

  const filtered = filter === 'all' ? projects : projects.filter(p => p.tag === filter);

  container.innerHTML = filtered.map(p => \`
    <div class="project-card p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs uppercase font-mono px-2 py-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60">\${p.tag}</span>
          <span class="text-xs text-slate-400 font-mono">\${p.metrics}</span>
        </div>
        <h3 class="text-lg font-bold text-slate-100 mb-2">\${p.title}</h3>
        <p class="text-sm text-slate-400 mb-6 leading-relaxed">\${p.description}</p>
      </div>
      <div class="flex flex-wrap gap-1.5">
        \${p.tech.map(t => \`<span class="text-[11px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">\${t}</span>\`).join('')}
      </div>
    </div>
  \`).join('');
}

// Filter button handlers
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('bg-indigo-600', 'text-white');
      b.classList.add('bg-slate-800', 'text-slate-400');
    });
    btn.classList.add('bg-indigo-600', 'text-white');
    btn.classList.remove('bg-slate-800', 'text-slate-400');

    renderProjects(btn.dataset.filter);
  });
});

// Contact form handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Contact submission sent:", {
      name: document.getElementById('nameInput')?.value,
      email: document.getElementById('emailInput')?.value,
      message: document.getElementById('messageInput')?.value
    });

    const toast = document.getElementById('toastMessage');
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
        contactForm.reset();
      }, 3500);
    }
  });
}

// Initial render
renderProjects();
console.log("Nexora Demo Portfolio loaded successfully.");`
      ),
    ],
  },
  react_app: {
    name: "Interactive React App",
    description: "Component-driven React 19 application with dynamic counter, task manager, and responsive layout.",
    files: [
      createDefaultFile(
        "index.html",
        "index.html",
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React 19 Interactive Workspace</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React & Babel Standalone for Client Execution -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
  <div id="root" class="w-full max-w-xl"></div>
  <script type="text/babel" src="App.jsx"></script>
</body>
</html>`,
        true
      ),
      createDefaultFile(
        "App.jsx",
        "App.jsx",
        `function App() {
  const [tasks, setTasks] = React.useState([
    { id: 1, text: "Explore Nexora Editor IDE", done: true },
    { id: 2, text: "Build a responsive mobile app with Capacitor", done: false },
    { id: 3, text: "Test Live Preview & Console debugging", done: false }
  ]);
  const [inputVal, setInputVal] = React.useState("");

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: inputVal.trim(), done: false }]);
    setInputVal("");
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.done).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-semibold">React 19 Workspace</span>
          <h1 className="text-2xl font-bold text-white">Task Commander</h1>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-mono">
          {completedCount} / {tasks.length} Done
        </div>
      </div>

      <form onSubmit={addTask} className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Add a new milestone..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={\`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all \${
              task.done
                ? "bg-slate-950/50 border-slate-800/60 opacity-60"
                : "bg-slate-950 border-slate-800 hover:border-slate-700"
            }\`}
          >
            <div className="flex items-center gap-3">
              <span className={\`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold \${
                task.done ? "bg-indigo-600 text-white" : "border border-slate-700"
              }\`}>
                {task.done ? "✓" : ""}
              </span>
              <span className={\`text-sm \${task.done ? "line-through text-slate-400" : "text-slate-200"}\`}>
                {task.text}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
              className="text-xs text-slate-500 hover:text-rose-400 p-1 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`
      ),
    ],
  },
  minecraft_server: {
    name: "Aetheria Minecraft Server",
    description: "Modern gaming community website with one-click IP copy, live player count, server status, and rank store.",
    files: [
      createDefaultFile(
        "index.html",
        "index.html",
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aetheria Network | Custom MMORPG & Survival</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-stone-950 text-stone-100 font-sans min-h-screen">
  <!-- Hero -->
  <div class="relative py-20 px-6 text-center border-b border-stone-800 overflow-hidden">
    <div class="max-w-3xl mx-auto">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono mb-6">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>1,428 Players Online</span>
      </div>
      <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-amber-400 mb-4 drop-shadow-md">
        AETHERIA NETWORK
      </h1>
      <p class="text-stone-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
        Join the premier custom survival & RPG Minecraft community with custom bosses, player economy, and zero pay-to-win.
      </p>

      <!-- Copy IP Box -->
      <div class="inline-flex items-center gap-3 p-2 bg-stone-900 border border-stone-700 rounded-2xl shadow-xl">
        <span class="font-mono text-sm sm:text-base font-bold text-stone-200 px-3" id="serverIp">play.aetheriamc.net</span>
        <button id="copyIpBtn" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all">
          Copy IP
        </button>
      </div>
      <p id="copiedNotice" class="text-xs text-amber-400 mt-2 font-mono hidden">✓ IP Copied to clipboard! Launch 1.20+ to connect.</p>
    </div>
  </div>

  <!-- Store Ranks -->
  <section class="max-w-5xl mx-auto py-16 px-6">
    <h2 class="text-2xl font-black text-center mb-8 uppercase tracking-wider">Community Store Ranks</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-emerald-400 uppercase tracking-widest">Knight Rank</span>
          <div class="text-3xl font-black my-3">$9.99</div>
          <ul class="text-xs text-stone-400 space-y-2 mb-6">
            <li>✓ 3 Extra Sethomes</li>
            <li>✓ /fly in Personal Claims</li>
            <li>✓ Colored Chat Prefix</li>
          </ul>
        </div>
        <button class="w-full py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase">Unlock Rank</button>
      </div>

      <div class="p-6 rounded-2xl bg-stone-900 border-2 border-amber-500 text-center flex flex-col justify-between relative shadow-lg shadow-amber-500/10">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] uppercase">Most Popular</div>
        <div>
          <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">Champion Rank</span>
          <div class="text-3xl font-black my-3">$24.99</div>
          <ul class="text-xs text-stone-300 space-y-2 mb-6">
            <li>✓ 8 Extra Sethomes</li>
            <li>✓ Auto-Smelt Mining Perk</li>
            <li>✓ Access to /workbench & /enderchest</li>
            <li>✓ Priority Queue Pass</li>
          </ul>
        </div>
        <button class="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold uppercase">Unlock Rank</button>
      </div>

      <div class="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-purple-400 uppercase tracking-widest">Aetherial Overlord</span>
          <div class="text-3xl font-black my-3">$49.99</div>
          <ul class="text-xs text-stone-400 space-y-2 mb-6">
            <li>✓ Unlimited Sethomes</li>
            <li>✓ Custom Animated Title</li>
            <li>✓ Instant Mob Drop Teleport</li>
            <li>✓ VIP Discord Role</li>
          </ul>
        </div>
        <button class="w-full py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase">Unlock Rank</button>
      </div>
    </div>
  </section>

  <script src="script.js"></script>
</body>
</html>`,
        true
      ),
      createDefaultFile(
        "style.css",
        "style.css",
        `body {
  background-color: #0c0a09;
}`
      ),
      createDefaultFile(
        "script.js",
        "script.js",
        `document.getElementById('copyIpBtn')?.addEventListener('click', () => {
  navigator.clipboard.writeText('play.aetheriamc.net').then(() => {
    const notice = document.getElementById('copiedNotice');
    if (notice) {
      notice.classList.remove('hidden');
      setTimeout(() => notice.classList.add('hidden'), 3000);
    }
  });
});
console.log("Aetheria Minecraft Server website initialized.");`
      ),
    ],
  },
  landing: {
    name: "SaaS Landing Page",
    description: "High-converting modern SaaS product page with interactive pricing toggle and bento grid.",
    files: [
      createDefaultFile(
        "index.html",
        "index.html",
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vortex AI | Enterprise Cloud Orchestration</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans antialiased min-h-screen">
  <div class="max-w-6xl mx-auto px-6 py-20 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-mono mb-6">
      🚀 Next-Gen Cloud Orchestration Engine
    </div>
    <h1 class="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
      Deploy servers in <span class="text-cyan-400">milliseconds</span>, not minutes.
    </h1>
    <p class="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
      Global serverless containers with automated failover, intelligent caching, and multi-cloud sync.
    </p>
    <div class="flex items-center justify-center gap-4">
      <button class="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition-all shadow-lg shadow-cyan-500/20">
        Start Free Trial
      </button>
      <button class="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-medium">
        Book Demo
      </button>
    </div>
  </div>
</body>
</html>`,
        true
      ),
      createDefaultFile(
        "style.css",
        "style.css",
        `/* Custom SaaS styles */`
      ),
      createDefaultFile(
        "script.js",
        "script.js",
        `console.log("Vortex SaaS page initialized.");`
      ),
    ],
  },
  dashboard: {
    name: "Analytics Dashboard",
    description: "Financial & telemetry metrics dashboard with dynamic SVG charts and data tables.",
    files: [
      createDefaultFile(
        "index.html",
        "index.html",
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Metrics Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans p-6 min-h-screen">
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold">Telemetry Control Center</h1>
        <p class="text-xs text-slate-400 font-mono">Live Node Cluster: us-east-1</p>
      </div>
      <button id="refreshDataBtn" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-semibold hover:bg-indigo-500">Refresh Data</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-xs text-slate-400">Total Throughput</span>
        <div class="text-2xl font-bold my-1" id="metric1">1.48 GB/s</div>
        <span class="text-xs text-emerald-400">↑ 12.4% vs last hour</span>
      </div>
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-xs text-slate-400">Active Microtasks</span>
        <div class="text-2xl font-bold my-1" id="metric2">8,421</div>
        <span class="text-xs text-indigo-400">0 errors reported</span>
      </div>
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-xs text-slate-400">P99 Latency</span>
        <div class="text-2xl font-bold my-1" id="metric3">14.2 ms</div>
        <span class="text-xs text-emerald-400">Optimal health</span>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        true
      ),
      createDefaultFile("style.css", "style.css", `/* Dashboard styles */`),
      createDefaultFile(
        "script.js",
        "script.js",
        `document.getElementById('refreshDataBtn')?.addEventListener('click', () => {
  const m1 = document.getElementById('metric1');
  const m2 = document.getElementById('metric2');
  const m3 = document.getElementById('metric3');
  if (m1) m1.textContent = (1.2 + Math.random() * 0.6).toFixed(2) + ' GB/s';
  if (m2) m2.textContent = Math.floor(7500 + Math.random() * 2000).toLocaleString();
  if (m3) m3.textContent = (11 + Math.random() * 6).toFixed(1) + ' ms';
  console.log("Telemetry metrics refreshed.");
});`
      ),
    ],
  },
  vanilla_js: {
    name: "JavaScript Canvas Game",
    description: "Interactive arcade canvas game with keyboard and touch controls.",
    files: [
      createDefaultFile(
        "index.html",
        "index.html",
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Retro Neon Asteroids</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white font-mono flex flex-col items-center justify-center min-h-screen p-4 select-none">
  <div class="text-center mb-3">
    <h1 class="text-xl font-bold text-pink-500 tracking-widest">NEON ASTEROIDS</h1>
    <div class="text-xs text-zinc-400">Score: <span id="scoreVal" class="text-cyan-400 font-bold">0</span> | Tap or Use Arrow Keys</div>
  </div>
  <canvas id="gameCanvas" width="400" height="400" class="bg-zinc-950 border-2 border-pink-500 rounded-xl shadow-lg shadow-pink-500/20 max-w-full"></canvas>
  <div class="flex gap-4 mt-4 md:hidden">
    <button id="leftBtn" class="px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-lg active:bg-zinc-800">◀</button>
    <button id="fireBtn" class="px-8 py-3 bg-pink-600 rounded-xl text-lg font-bold active:bg-pink-500">FIRE</button>
    <button id="rightBtn" class="px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-lg active:bg-zinc-800">▶</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        true
      ),
      createDefaultFile("style.css", "style.css", `canvas { touch-action: none; }`),
      createDefaultFile(
        "script.js",
        "script.js",
        `const canvas = document.getElementById('gameCanvas');
const ctx = canvas?.getContext('2d');
let score = 0;
let player = { x: 200, y: 360, vx: 0 };
let bullets = [];
let targets = [];

function spawnTarget() {
  targets.push({ x: Math.random() * 360 + 20, y: 0, speed: 1.5 + Math.random() * 2 });
}
setInterval(spawnTarget, 1000);

function update() {
  if (!ctx) return;
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, 400, 400);

  // Player
  player.x += player.vx;
  if (player.x < 20) player.x = 20;
  if (player.x > 380) player.x = 380;

  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 15);
  ctx.lineTo(player.x - 12, player.y + 10);
  ctx.lineTo(player.x + 12, player.y + 10);
  ctx.closePath();
  ctx.fill();

  // Bullets
  ctx.fillStyle = '#06b6d4';
  bullets.forEach((b, bi) => {
    b.y -= 7;
    ctx.fillRect(b.x - 2, b.y, 4, 10);
    if (b.y < 0) bullets.splice(bi, 1);
  });

  // Targets
  ctx.fillStyle = '#eab308';
  targets.forEach((t, ti) => {
    t.y += t.speed;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Check hit
    bullets.forEach((b, bi) => {
      const dist = Math.hypot(b.x - t.x, b.y - t.y);
      if (dist < 14) {
        targets.splice(ti, 1);
        bullets.splice(bi, 1);
        score += 100;
        const el = document.getElementById('scoreVal');
        if (el) el.textContent = score;
      }
    });

    if (t.y > 400) targets.splice(ti, 1);
  });

  requestAnimationFrame(update);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') player.vx = -4;
  if (e.key === 'ArrowRight' || e.key === 'd') player.vx = 4;
  if (e.key === ' ' || e.key === 'ArrowUp') bullets.push({ x: player.x, y: player.y - 15 });
});
window.addEventListener('keyup', () => player.vx = 0);

document.getElementById('leftBtn')?.addEventListener('pointerdown', () => player.vx = -4);
document.getElementById('leftBtn')?.addEventListener('pointerup', () => player.vx = 0);
document.getElementById('rightBtn')?.addEventListener('pointerdown', () => player.vx = 4);
document.getElementById('rightBtn')?.addEventListener('pointerup', () => player.vx = 0);
document.getElementById('fireBtn')?.addEventListener('pointerdown', () => bullets.push({ x: player.x, y: player.y - 15 }));

update();
console.log("Neon Asteroids game started.");`
      ),
    ],
  },
  tailwind_app: {
    name: "Tailwind UI Showcase",
    description: "Component library demo showing responsive cards, tabs, and interactive toggles.",
    files: [
      createDefaultFile(
        "index.html",
        "index.html",
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tailwind UI Components</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-8 min-h-screen">
  <div class="max-w-4xl mx-auto space-y-8">
    <h1 class="text-3xl font-bold">Tailwind UI Kit</h1>
    <div class="p-6 bg-slate-800 rounded-2xl border border-slate-700">
      <h2 class="text-lg font-semibold mb-2">Clean Card Pattern</h2>
      <p class="text-sm text-slate-400">Styling with utility classes directly in Nexora Editor.</p>
    </div>
  </div>
</body>
</html>`,
        true
      ),
      createDefaultFile("style.css", "style.css", `/* Tailwind custom rules */`),
      createDefaultFile("script.js", "script.js", `console.log("Tailwind UI showcase loaded.");`),
    ],
  },
  blank: {
    name: "Blank HTML5 Project",
    description: "Clean starter template with HTML5, CSS3, and JavaScript files ready for your custom code.",
    files: [
      createDefaultFile(
        "index.html",
        "index.html",
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Nexora Project</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex items-center justify-center p-6">
  <div class="text-center max-w-md">
    <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold shadow-lg shadow-indigo-600/30">
      ⚡
    </div>
    <h1 class="text-2xl font-bold tracking-tight mb-2">Nexora Editor</h1>
    <p class="text-slate-400 text-sm mb-6">Edit <code class="text-indigo-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">index.html</code> to start building your application.</p>
    <button id="demoBtn" class="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20">
      Click Me
    </button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        true
      ),
      createDefaultFile(
        "style.css",
        "style.css",
        `/* Custom styles */
body {
  margin: 0;
}`
      ),
      createDefaultFile(
        "script.js",
        "script.js",
        `document.getElementById('demoBtn')?.addEventListener('click', () => {
  console.log("Button clicked inside Live Preview!");
  alert("Hello from Nexora Editor!");
});
console.log("Blank project initialized.");`
      ),
    ],
  },
};

export const PROJECT_TEMPLATES = TEMPLATES;
export const createProjectFromTemplate = (
  templateType: ProjectTemplateType,
  name?: string,
  userId?: string
): Project => {
  const template = TEMPLATES[templateType] || TEMPLATES.portfolio;
  return {
    id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: name || template.name,
    description: template.description,
    templateType,
    files: JSON.parse(JSON.stringify(template.files)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: userId || null,
    visibility: "private",
    tags: [templateType, "web"],
    version: 1,
  };
};
