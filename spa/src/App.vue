<script setup>
import { ref, computed } from 'vue';

// Widely documented quotes, kept to the original wording and attributed to their authors.
const quotes = ref([
  {
    id: 1,
    text: "Information is power. But like all power, there are those who want to keep it for themselves.",
    author: "Aaron Swartz",
    role: "Information Activist & Open-Access Pioneer",
    category: "OPEN_KNOWLEDGE",
  },
  {
    id: 2,
    text: "Security is a process, not a product.",
    author: "Bruce Schneier",
    role: "Cryptographer & Security Technologist",
    category: "CONTINUOUS_DEFENSE",
  },
  {
    id: 3,
    text: "Companies spend millions of dollars on firewalls, encryption, and secure access devices, and it's money wasted because none of these measures address the weakest link in the security chain.",
    author: "Kevin Mitnick",
    role: "Social Engineer & Security Researcher",
    category: "HUMAN_FACTOR",
  },
  {
    id: 4,
    text: "Yes, I am a criminal. My crime is that of curiosity.",
    author: "The Mentor",
    role: "Author of 'The Conscience of a Hacker' (1986)",
    category: "RADICAL_CURIOSITY",
  },
  {
    id: 5,
    text: "Amateurs hack systems, professionals hack people.",
    author: "Bruce Schneier",
    role: "Cryptographer & Security Technologist",
    category: "ADVERSARIAL_MINDSET",
  },
  {
    id: 6,
    text: "The most dangerous phrase in the language is 'We've always done it this way.'",
    author: "Grace Hopper",
    role: "Computer Science Pioneer & Rear Admiral",
    category: "BREAK_ORTHODOXY",
  },
  {
    id: 7,
    text: "The enemy knows the system.",
    author: "Claude Shannon",
    role: "Father of Information Theory",
    category: "CRYPTO_TRANSPARENCY",
  },
  {
    id: 8,
    text: "If it's smart, it's vulnerable.",
    author: "Mikko Hyppönen",
    role: "Security Researcher",
    category: "THREAT_AWARENESS",
  },
]);

const currentIndex = ref(0);
const copied = ref(false);
let copiedTimer = null;

const currentQuote = computed(() => quotes.value[currentIndex.value]);
const pad = (n) => String(n).padStart(2, '0');
const packetNum = computed(() => pad(currentIndex.value + 1));
const packetTotal = computed(() => pad(quotes.value.length));

function resetCopied() {
  copied.value = false;
  clearTimeout(copiedTimer);
}

function prevQuote() {
  resetCopied();
  currentIndex.value =
    (currentIndex.value - 1 + quotes.value.length) % quotes.value.length;
}

function nextQuote() {
  resetCopied();
  currentIndex.value = (currentIndex.value + 1) % quotes.value.length;
}

function randomQuote() {
  if (quotes.value.length <= 1) return;
  resetCopied();
  let next = currentIndex.value;
  while (next === currentIndex.value) {
    next = Math.floor(Math.random() * quotes.value.length);
  }
  currentIndex.value = next;
}

// Old-browser / non-HTTPS fallback
function legacyCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!ok) throw new Error('execCommand copy failed');
}

async function copyQuote() {
  const q = currentQuote.value;
  const text = `"${q.text}" — ${q.author} [${q.category}]`;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      legacyCopy(text);
    }
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, 2200);
  } catch (err) {
    console.warn('Payload copy failed:', err);
  }
}

// 2-letter handle tag (ignores punctuation, handles accented names)
function getInitials(name) {
  const parts = name.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#050505] text-[#00ff41] font-mono antialiased relative overflow-x-hidden">

    <!-- CRT Scanlines & Matrix Grid Overlay -->
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div class="inset-0 absolute bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] opacity-75"></div>
      <div class="inset-0 absolute bg-[radial-gradient(#00ff41_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.06]"></div>
      <div class="absolute -top-40 left-1/3 w-96 h-96 bg-[#00ff41]/[0.04] rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 right-1/4 w-96 h-96 bg-[#ff2a55]/[0.04] rounded-full blur-3xl"></div>
    </div>

    <!-- Top Terminal Status Bar -->
    <header class="relative z-10 border-b border-[#00ff41]/25 bg-[#050505]/90 backdrop-blur-sm">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        <a href="#" class="flex items-center space-x-2.5 group">
          <span class="px-1.5 py-0.5 text-[11px] font-bold bg-[#00ff41] text-[#050505] tracking-tighter">
            ROOT@0x00
          </span>
          <span class="text-xs sm:text-sm font-bold tracking-wider text-zinc-100 group-hover:text-[#00ff41] transition-colors">
            ANON<span class="text-[#00ff41]">//</span>LEARNING_NODE
          </span>
        </a>

        <nav aria-label="Node Controls" class="flex items-center space-x-4 sm:space-x-6 text-[11px] sm:text-xs">
          <span class="hidden md:inline-block text-[#ffb000]/90 tracking-widest">
            OP_KNOWLEDGE // [ENCRYPTED]
          </span>
          <button
            @click="randomQuote"
            class="text-zinc-400 hover:text-[#00ff41] underline decoration-[#00ff41]/40 underline-offset-4 transition-colors cursor-pointer"
          >
            [SHUFFLE_SIG]
          </button>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#00ff41]/40 bg-[#00ff41]/10 text-[#00ff41]">
            <span class="w-1.5 h-1.5 bg-[#00ff41] animate-ping"></span>
            <span>TOR_RELAY:ON</span>
          </span>
        </nav>
      </div>
    </header>

    <!-- Hero & Terminal Transmission Box -->
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div class="max-w-3xl w-full mx-auto text-center space-y-8 sm:space-y-10">

        <div class="space-y-4">
          <div class="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1 border border-[#ff2a55]/40 bg-[#ff2a55]/10 text-[11px] sm:text-xs text-[#ff2a55] tracking-widest uppercase">
            <span>[!]</span>
            <span>INFORMATION_WANTS_TO_BE_FREE // 0x534543</span>
          </div>

          <div class="relative inline-block">
            <h1 class="relative text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 uppercase leading-tight">
              <span class="block text-[#00ff41] drop-shadow-[0_0_12px_rgba(0,255,65,0.35)]">
                &gt; KNOWLEDGE IS RESISTANCE.
              </span>
              <span class="block mt-1 text-zinc-100">
                NEVER STOP
                <span class="relative inline-block text-[#00ff41]"><span aria-hidden="true" class="absolute -left-[2px] top-[1px] text-[#ff2a55] opacity-75 select-none pointer-events-none">DECODING.</span>DECODING.</span>
              </span>
            </h1>
          </div>

          <p class="max-w-xl mx-auto text-xs sm:text-sm text-zinc-400 leading-relaxed">
            // Uncensored dispatches from cryptographers, researchers, and digital rebels on curiosity, reverse-engineering, and relentless self-education.
          </p>
        </div>

        <section id="quote-stage" aria-label="Intercepted Security Transmission" class="text-left">
          <div class="relative bg-[#080808]/95 border border-[#00ff41]/35 p-5 sm:p-9 shadow-[0_0_40px_rgba(0,255,65,0.06)] transition-all duration-200">

            <span aria-hidden="true" class="absolute -top-[1px] -left-[1px] w-3.5 h-3.5 border-t-2 border-l-2 border-[#00ff41]"></span>
            <span aria-hidden="true" class="absolute -top-[1px] -right-[1px] w-3.5 h-3.5 border-t-2 border-r-2 border-[#00ff41]"></span>
            <span aria-hidden="true" class="absolute -bottom-[1px] -left-[1px] w-3.5 h-3.5 border-b-2 border-l-2 border-[#00ff41]"></span>
            <span aria-hidden="true" class="absolute -bottom-[1px] -right-[1px] w-3.5 h-3.5 border-b-2 border-r-2 border-[#00ff41]"></span>

            <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-[#00ff41]/20 text-[11px] sm:text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-[#00ff41]/15 border border-[#00ff41]/40 text-[#00ff41] uppercase font-bold">
                  TAG::{{ currentQuote.category }}
                </span>
                <span class="text-[#ffb000] hidden sm:inline">[SIG_VERIFIED]</span>
              </div>
              <span class="text-zinc-400">
                PACKET <span class="text-[#00ff41] font-bold">{{ packetNum }}</span>/{{ packetTotal }}
              </span>
            </div>

            <blockquote class="min-h-[125px] sm:min-h-[135px] flex items-center">
              <p class="text-base sm:text-xl md:text-2xl font-medium text-zinc-100 leading-relaxed tracking-normal">
                <span class="text-[#00ff41] font-bold mr-2 select-none">$&gt;</span>"{{ currentQuote.text }}"<span class="inline-block w-2.5 h-5 ml-1.5 align-middle bg-[#00ff41] animate-pulse"></span>
              </p>
            </blockquote>

            <div class="mt-8 pt-5 border-t border-[#00ff41]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 bg-[#050505] border border-[#00ff41]/50 flex items-center justify-center text-xs font-bold text-[#00ff41] shrink-0 shadow-[inset_0_0_10px_rgba(0,255,65,0.15)]">
                  [{{ getInitials(currentQuote.author) }}]
                </div>
                <div>
                  <div class="text-sm sm:text-base font-bold text-zinc-100 tracking-wide">{{ currentQuote.author }}</div>
                  <div class="text-[11px] sm:text-xs text-[#ffb000]/90">// {{ currentQuote.role }}</div>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  @click="prevQuote"
                  aria-label="Previous Transmission"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#050505] hover:bg-[#00ff41]/10 text-zinc-300 hover:text-[#00ff41] border border-zinc-700 hover:border-[#00ff41]/60 transition-colors cursor-pointer active:translate-y-[1px]"
                >
                  <span>&lt;-</span>
                  <span>PREV</span>
                </button>

                <button
                  @click="nextQuote"
                  aria-label="Next Transmission"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#00ff41]/15 hover:bg-[#00ff41] text-[#00ff41] hover:text-[#050505] border border-[#00ff41] transition-colors cursor-pointer active:translate-y-[1px]"
                >
                  <span>NEXT_TRANSMISSION</span>
                  <span>-&gt;</span>
                </button>

                <button
                  @click="copyQuote"
                  aria-label="Copy Transmission"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-xs border transition-colors cursor-pointer active:translate-y-[1px]"
                  :class="copied
                    ? 'bg-[#ffb000]/20 border-[#ffb000] text-[#ffb000] font-bold'
                    : 'bg-[#050505] hover:bg-[#ff2a55]/15 border-zinc-700 hover:border-[#ff2a55] text-zinc-300 hover:text-[#ff2a55]'"
                >
                  <span>{{ copied ? '[DUMPED_TO_CLIPBOARD]' : '[COPY_PAYLOAD]' }}</span>
                </button>
              </div>
            </div>

          </div>
        </section>

      </div>
    </main>

    <footer class="relative z-10 border-t border-[#00ff41]/25 bg-[#050505]/95">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
        <div class="flex items-center gap-2">
          <span class="text-[#00ff41]">PGP: 0x9F8B-42E1-DEAD-BEEF</span>
          <span class="hidden sm:inline text-zinc-700">|</span>
          <span class="hidden sm:inline">NO_LOGS // NO_MASTERS</span>
        </div>
        <div class="text-[#ff2a55]/90 tracking-wider">CURIOSITY IS NOT A CRIME</div>
      </div>
    </footer>

  </div>
</template>
