<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Dashboard - cadence</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&amp;family=JetBrains+Mono:wght@400;500;700&amp;family=Hanken+Grotesk:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-secondary-fixed": "#1a1c1c",
                    "surface-dim": "#dadadb",
                    "on-error": "#ffffff",
                    "tertiary-container": "#1a1b22",
                    "on-surface": "#1a1c1d",
                    "surface-variant": "#e2e2e3",
                    "surface-bright": "#f9f9fa",
                    "inverse-on-surface": "#f0f1f2",
                    "background": "#f9f9fa",
                    "on-primary": "#ffffff",
                    "tertiary-fixed-dim": "#c6c5cf",
                    "on-background": "#1a1c1d",
                    "on-primary-container": "#848484",
                    "primary-container": "#1b1b1b",
                    "inverse-surface": "#2f3132",
                    "error-container": "#ffdad6",
                    "surface-container-lowest": "#ffffff",
                    "secondary": "#5d5f5f",
                    "on-primary-fixed": "#1b1b1b",
                    "on-secondary": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-tertiary-fixed-variant": "#46464e",
                    "on-surface-variant": "#4c4546",
                    "primary-fixed": "#e2e2e2",
                    "surface": "#f9f9fa",
                    "tertiary": "#000000",
                    "surface-container-low": "#f3f3f4",
                    "secondary-container": "#dfe0e0",
                    "on-secondary-fixed-variant": "#454747",
                    "inverse-primary": "#c6c6c6",
                    "surface-container": "#eeeeef",
                    "primary": "#000000",
                    "on-tertiary-container": "#83838c",
                    "surface-container-high": "#e8e8e9",
                    "on-tertiary": "#ffffff",
                    "error": "#ba1a1a",
                    "secondary-fixed-dim": "#c6c6c7",
                    "primary-fixed-dim": "#c6c6c6",
                    "on-secondary-container": "#616363",
                    "outline-variant": "#cfc4c5",
                    "surface-tint": "#5e5e5e",
                    "tertiary-fixed": "#e3e1ec",
                    "outline": "#7e7576",
                    "surface-container-highest": "#e2e2e3",
                    "on-primary-fixed-variant": "#474747",
                    "secondary-fixed": "#e2e2e2",
                    "on-tertiary-fixed": "#1a1b22"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "gutter": "24px",
                    "max-width": "1200px",
                    "margin-mobile": "16px",
                    "sm": "8px",
                    "xs": "4px",
                    "xl": "48px",
                    "lg": "24px",
                    "margin-desktop": "64px",
                    "unit": "4px",
                    "md": "16px"
            },
            "fontFamily": {
                    "display-lg-mobile": [
                            "Libre Caslon Text"
                    ],
                    "headline-md": [
                            "Libre Caslon Text"
                    ],
                    "label-mono": [
                            "JetBrains Mono"
                    ],
                    "button": [
                            "Hanken Grotesk"
                    ],
                    "body-md": [
                            "Hanken Grotesk"
                    ],
                    "display-lg": [
                            "Libre Caslon Text"
                    ],
                    "body-lg": [
                            "Hanken Grotesk"
                    ]
            },
            "fontSize": {
                    "display-lg-mobile": [
                            "32px",
                            {
                                    "lineHeight": "1.2",
                                    "fontWeight": "400"
                            }
                    ],
                    "headline-md": [
                            "24px",
                            {
                                    "lineHeight": "1.3",
                                    "fontWeight": "400"
                            }
                    ],
                    "label-mono": [
                            "12px",
                            {
                                    "lineHeight": "1.2",
                                    "letterSpacing": "0.05em",
                                    "fontWeight": "500"
                            }
                    ],
                    "button": [
                            "14px",
                            {
                                    "lineHeight": "1",
                                    "letterSpacing": "0.02em",
                                    "fontWeight": "600"
                            }
                    ],
                    "body-md": [
                            "15px",
                            {
                                    "lineHeight": "1.5",
                                    "fontWeight": "400"
                            }
                    ],
                    "display-lg": [
                            "48px",
                            {
                                    "lineHeight": "1.1",
                                    "letterSpacing": "-0.02em",
                                    "fontWeight": "400"
                            }
                    ],
                    "body-lg": [
                            "18px",
                            {
                                    "lineHeight": "1.6",
                                    "fontWeight": "400"
                            }
                    ]
            }
        },
        },
      }
    </script>
<style>
        body {
            background-color: theme('colors.surface');
            color: theme('colors.on-surface');
            font-family: theme('fontFamily.body-md');
            /* Grid background overlay */
            background-image: linear-gradient(to right, theme('colors.outline-variant') 1px, transparent 1px),
                              linear-gradient(to bottom, theme('colors.outline-variant') 1px, transparent 1px);
            background-size: 64px 64px;
            background-attachment: fixed;
            background-position: center top;
        }
        
        .grid-bg-mask {
            position: absolute;
            inset: 0;
            background-color: rgba(249, 249, 250, 0.85); /* surface color with opacity */
            z-index: -1;
        }

        /* High-contrast charting specific styles */
        .chart-grid-line {
            stroke: theme('colors.outline-variant');
            stroke-width: 1;
            stroke-dasharray: 4 4;
        }
        .chart-path-line {
            stroke: theme('colors.primary');
            stroke-width: 1.5;
            fill: none;
        }
        .chart-path-area {
            fill: url(#chart-gradient);
            opacity: 0.1;
        }
        .chart-axis-text {
            fill: theme('colors.secondary');
            font-family: theme('fontFamily.label-mono');
            font-size: 10px;
        }
        .chart-bar {
            fill: theme('colors.primary');
        }
    </style>
</head>
<body class="min-h-screen relative flex flex-col">
<div class="grid-bg-mask"></div>
<!-- TopNavBar -->
<header class="w-full h-16 bg-surface dark:bg-surface border-b border-outline-variant dark:border-outline-variant transition-all duration-100 ease-in-out relative z-10">
<div class="flex justify-between items-center px-margin-desktop max-w-max-width mx-auto h-full">
<!-- Brand -->
<div class="font-headline-md text-headline-md font-bold tracking-tighter text-primary dark:text-on-primary-fixed">
                cadence
            </div>
<!-- Navigation Links -->
<nav class="hidden md:flex items-end h-full gap-lg">
<a class="font-button text-button text-primary dark:text-on-primary-fixed border-b-2 border-primary dark:border-on-primary-fixed pb-4 hover:text-primary dark:hover:text-on-primary-fixed transition-colors duration-100" href="#">
                    Dashboard
                </a>
<a class="font-button text-button text-secondary dark:text-on-secondary-container pb-4 hover:text-primary dark:hover:text-on-primary-fixed transition-colors duration-100" href="#">
                    Setup
                </a>
<a class="font-button text-button text-secondary dark:text-on-secondary-container pb-4 hover:text-primary dark:hover:text-on-primary-fixed transition-colors duration-100" href="#">
                    Settings
                </a>
</nav>
<!-- Trailing Actions -->
<div class="flex items-center gap-md">
<button class="text-secondary hover:text-primary dark:text-on-secondary-container dark:hover:text-on-primary-fixed transition-colors duration-100">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">notifications</span>
</button>
<button class="text-secondary hover:text-primary dark:text-on-secondary-container dark:hover:text-on-primary-fixed transition-colors duration-100">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">account_circle</span>
</button>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="flex-1 w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-xl z-10 flex flex-col gap-lg">
<!-- Top Row: Trend & Mix -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
<!-- 30-Day Coding Trend -->
<div class="lg:col-span-2 bg-surface border border-outline-variant rounded p-lg flex flex-col gap-md relative">
<div class="flex justify-between items-start">
<div class="flex items-center gap-sm text-primary">
<span class="material-symbols-outlined text-[20px]">trending_up</span>
<h2 class="font-headline-md text-headline-md">30-Day Coding Trend</h2>
</div>
<div class="font-label-mono text-label-mono text-secondary">
                        32.1h total
                    </div>
</div>
<div class="relative h-[240px] w-full mt-md">
<!-- Faux Line Chart SVG -->
<svg height="100%" preserveaspectratio="none" viewbox="0 0 800 240" width="100%">
<defs>
<lineargradient id="chart-gradient" x1="0" x2="0" y1="0" y2="1">
<stop class="text-primary" offset="0%" stop-color="currentColor"></stop>
<stop class="text-primary" offset="100%" stop-color="currentColor" stop-opacity="0"></stop>
</lineargradient>
</defs>
<!-- Grid Lines -->
<line class="chart-grid-line" x1="40" x2="800" y1="20" y2="20"></line>
<line class="chart-grid-line" x1="40" x2="800" y1="70" y2="70"></line>
<line class="chart-grid-line" x1="40" x2="800" y1="120" y2="120"></line>
<line class="chart-grid-line" x1="40" x2="800" y1="170" y2="170"></line>
<!-- Y-Axis Labels -->
<text class="chart-axis-text" text-anchor="end" x="30" y="24">3h 12m</text>
<text class="chart-axis-text" text-anchor="end" x="30" y="74">2h 24m</text>
<text class="chart-axis-text" text-anchor="end" x="30" y="124">1h 36m</text>
<text class="chart-axis-text" text-anchor="end" x="30" y="174">48m</text>
<text class="chart-axis-text" text-anchor="end" x="30" y="224">0m</text>
<!-- X-Axis Labels -->
<text class="chart-axis-text" text-anchor="middle" x="40" y="235">May 14</text>
<text class="chart-axis-text" text-anchor="middle" x="230" y="235">May 21</text>
<text class="chart-axis-text" text-anchor="middle" x="420" y="235">May 28</text>
<text class="chart-axis-text" text-anchor="middle" x="610" y="235">Jun 4</text>
<text class="chart-axis-text" text-anchor="end" x="800" y="235">Jun 11</text>
<!-- Area & Line -->
<!-- Data roughly matching the image, normalized -->
<path class="chart-path-area" d="M40,60 L80,70 L120,60 L160,80 L200,40 L230,200 L250,90 L280,90 L310,130 L340,40 L370,120 L400,20 L440,160 L460,170 L500,210 L540,210 L580,160 L620,150 L660,180 L690,100 L720,200 L760,180 L800,210 L800,220 L40,220 Z"></path>
<path class="chart-path-line" d="M40,60 L80,70 L120,60 L160,80 L200,40 L230,200 L250,90 L280,90 L310,130 L340,40 L370,120 L400,20 L440,160 L460,170 L500,210 L540,210 L580,160 L620,150 L660,180 L690,100 L720,200 L760,180 L800,210"></path>
</svg>
</div>
</div>
<!-- Language Mix -->
<div class="bg-surface border border-outline-variant rounded p-lg flex flex-col gap-md">
<div class="flex items-center gap-sm text-primary">
<span class="material-symbols-outlined text-[20px]">donut_large</span>
<h2 class="font-headline-md text-headline-md">Language Mix</h2>
</div>
<div class="flex-1 flex flex-col justify-center items-center gap-lg">
<!-- Faux Donut Chart SVG -->
<div class="w-[160px] h-[160px] relative">
<svg class="w-full h-full transform -rotate-90" viewbox="0 0 36 36">
<!-- Background ring -->
<circle cx="18" cy="18" fill="transparent" r="15.91549430918954" stroke="theme('colors.surface-variant')" stroke-width="4"></circle>
<!-- Typescriptreact (30%) - Darkest -->
<circle cx="18" cy="18" fill="transparent" r="15.91549430918954" stroke="#000000" stroke-dasharray="30 70" stroke-dashoffset="0" stroke-width="4"></circle>
<!-- Javascriptreact (23%) - Dark Gray -->
<circle cx="18" cy="18" fill="transparent" r="15.91549430918954" stroke="#5d5f5f" stroke-dasharray="23 77" stroke-dashoffset="-30" stroke-width="4"></circle>
<!-- Typescript (23%) - Mid Gray -->
<circle cx="18" cy="18" fill="transparent" r="15.91549430918954" stroke="#7e7576" stroke-dasharray="23 77" stroke-dashoffset="-53" stroke-width="4"></circle>
<!-- Css (13%) - Light Gray -->
<circle cx="18" cy="18" fill="transparent" r="15.91549430918954" stroke="#c6c6c7" stroke-dasharray="13 87" stroke-dashoffset="-76" stroke-width="4"></circle>
<!-- Python (5%) & Javascript (6%) combined into outline color for simplicity in high-contrast -->
<circle cx="18" cy="18" fill="transparent" r="15.91549430918954" stroke="#e2e2e3" stroke-dasharray="11 89" stroke-dashoffset="-89" stroke-width="4"></circle>
</svg>
<!-- Center hollow -->
<div class="absolute inset-0 bg-surface rounded-full m-4"></div>
</div>
<!-- Legend -->
<div class="grid grid-cols-2 gap-x-md gap-y-sm w-full font-label-mono text-[10px] text-secondary">
<div class="flex justify-between items-center"><div class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-primary"></span>Typescriptreact</div> <span>30%</span></div>
<div class="flex justify-between items-center"><div class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-[#5d5f5f]"></span>Typescript</div> <span>23%</span></div>
<div class="flex justify-between items-center"><div class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-[#7e7576]"></span>Javascriptreact</div> <span>23%</span></div>
<div class="flex justify-between items-center"><div class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-[#c6c6c7]"></span>Css</div> <span>13%</span></div>
<div class="flex justify-between items-center"><div class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-[#e2e2e3]"></span>Javascript</div> <span>6%</span></div>
<div class="flex justify-between items-center"><div class="flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-outline-variant border border-outline"></span>Python</div> <span>5%</span></div>
</div>
</div>
</div>
</div>
<!-- Middle Row: Daily Hours & Breakdown -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-lg">
<!-- Daily Hours Bar Chart -->
<div class="bg-surface border border-outline-variant rounded p-lg flex flex-col gap-md">
<div class="flex justify-between items-start">
<div class="flex items-center gap-sm text-primary">
<span class="material-symbols-outlined text-[20px]">bar_chart</span>
<h2 class="font-headline-md text-headline-md">Daily Hours</h2>
</div>
<!-- Time Filters -->
<div class="flex gap-xs bg-surface-container-low p-xs rounded border border-outline-variant">
<button class="px-2 py-1 font-label-mono text-label-mono text-secondary hover:bg-surface-variant rounded transition-colors">7D</button>
<button class="px-2 py-1 font-label-mono text-label-mono text-primary bg-surface border border-outline-variant shadow-sm rounded">14D</button>
<button class="px-2 py-1 font-label-mono text-label-mono text-secondary hover:bg-surface-variant rounded transition-colors">1M</button>
<button class="px-2 py-1 font-label-mono text-label-mono text-secondary hover:bg-surface-variant rounded transition-colors">3M</button>
<button class="px-2 py-1 font-label-mono text-label-mono text-secondary hover:bg-surface-variant rounded transition-colors">1Y</button>
</div>
</div>
<div class="relative h-[200px] w-full mt-md">
<!-- Faux Bar Chart SVG -->
<svg height="100%" preserveaspectratio="none" viewbox="0 0 400 200" width="100%">
<!-- Grid Lines -->
<line class="chart-grid-line" x1="40" x2="400" y1="20" y2="20"></line>
<line class="chart-grid-line" x1="40" x2="400" y1="70" y2="70"></line>
<line class="chart-grid-line" x1="40" x2="400" y1="120" y2="120"></line>
<line class="chart-grid-line" x1="40" x2="400" y1="170" y2="170"></line>
<line stroke="theme('colors.outline')" stroke-width="1" x1="40" x2="400" y1="170" y2="170"></line> <!-- Baseline -->
<!-- Y-Axis Labels -->
<text class="chart-axis-text" text-anchor="end" x="30" y="24">1h 36m</text>
<text class="chart-axis-text" text-anchor="end" x="30" y="74">1h 12m</text>
<text class="chart-axis-text" text-anchor="end" x="30" y="124">48m</text>
<text class="chart-axis-text" text-anchor="end" x="30" y="174">0m</text>
<!-- X-Axis Labels (Sampled) -->
<text class="chart-axis-text" text-anchor="middle" x="60" y="185">30 Sat</text>
<text class="chart-axis-text" text-anchor="middle" x="110" y="185">1 Mon</text>
<text class="chart-axis-text" text-anchor="middle" x="160" y="185">3 Wed</text>
<text class="chart-axis-text" text-anchor="middle" x="210" y="185">5 Fri</text>
<text class="chart-axis-text" text-anchor="middle" x="260" y="185">7 Sun</text>
<text class="chart-axis-text" text-anchor="middle" x="310" y="185">9 Tue</text>
<text class="chart-axis-text" text-anchor="middle" x="360" y="185">11 Thu</text>
<!-- Bars -->
<rect class="chart-bar" height="10" width="20" x="50" y="160"></rect>
<rect class="chart-bar" height="70" width="20" x="75" y="100"></rect>
<rect class="chart-bar" height="80" width="20" x="100" y="90"></rect>
<rect class="chart-bar" height="100" width="20" x="125" y="70"></rect>
<rect class="chart-bar" height="60" width="20" x="150" y="110"></rect>
<rect class="chart-bar" height="40" width="20" x="175" y="130"></rect>
<rect class="chart-bar" height="120" width="20" x="200" y="50"></rect>
<rect class="chart-bar" height="5" width="20" x="225" y="165"></rect>
<rect class="chart-bar" height="5" width="20" x="250" y="165"></rect>
<rect class="chart-bar" height="20" width="20" x="275" y="150"></rect>
<rect class="chart-bar" height="40" width="20" x="300" y="130"></rect>
<rect class="chart-bar" height="70" width="20" x="325" y="100"></rect>
<rect class="chart-bar" height="5" width="20" x="350" y="165"></rect>
</svg>
</div>
</div>
<!-- Productivity Breakdown Radar Chart -->
<div class="bg-surface border border-outline-variant rounded p-lg flex flex-col gap-md">
<div class="flex items-center gap-sm text-primary">
<span class="material-symbols-outlined text-[20px]">bolt</span>
<h2 class="font-headline-md text-headline-md">Productivity Breakdown</h2>
</div>
<div class="flex-1 flex justify-center items-center relative h-[200px]">
<!-- Faux Radar Chart SVG -->
<svg class="max-h-full" height="240" viewbox="0 0 240 240" width="240">
<g transform="translate(120, 120)">
<!-- Axis lines & Web -->
<polygon fill="none" points="0,-80 76,-24 47,64 -47,64 -76,-24" stroke="theme('colors.outline-variant')" stroke-width="1"></polygon>
<polygon fill="none" points="0,-53 50,-16 31,42 -31,42 -50,-16" stroke="theme('colors.outline-variant')" stroke-width="1"></polygon>
<polygon fill="none" points="0,-26 25,-8 15,21 -15,21 -25,-8" stroke="theme('colors.outline-variant')" stroke-width="1"></polygon>
<line stroke="theme('colors.outline-variant')" stroke-width="1" x1="0" x2="0" y1="0" y2="-80"></line>
<line stroke="theme('colors.outline-variant')" stroke-width="1" x1="0" x2="76" y1="0" y2="-24"></line>
<line stroke="theme('colors.outline-variant')" stroke-width="1" x1="0" x2="47" y1="0" y2="64"></line>
<line stroke="theme('colors.outline-variant')" stroke-width="1" x1="0" x2="-47" y1="0" y2="64"></line>
<line stroke="theme('colors.outline-variant')" stroke-width="1" x1="0" x2="-76" y1="0" y2="-24"></line>
<!-- Data Polygon (Filled) -->
<!-- Values roughly: Focus (Top) High, Streak (Right-Top) Med, Languages (Right-Bot) High, Consistency (Left-Bot) Low, Sessions (Left-Top) High -->
<polygon fill="theme('colors.surface-variant')" fill-opacity="0.5" points="0,-60 40,-15 60,40 -20,10 -70,-30" stroke="theme('colors.primary')" stroke-width="1.5"></polygon>
</g>
<!-- Labels -->
<text class="chart-axis-text" text-anchor="middle" x="120" y="25">Focus</text>
<text class="chart-axis-text" text-anchor="middle" x="210" y="85">Streak</text>
<text class="chart-axis-text" text-anchor="middle" x="210" y="165">Languages</text>
<text class="chart-axis-text" text-anchor="middle" x="120" y="215">Consistency</text>
<text class="chart-axis-text" text-anchor="middle" x="30" y="165">Sessions</text>
<text class="chart-axis-text" text-anchor="middle" x="30" y="85">Projects</text>
</svg>
</div>
</div>
</div>
<!-- Bottom Row: Goals List -->
<div class="bg-surface border border-outline-variant rounded p-lg flex flex-col gap-md">
<div class="flex justify-between items-center">
<div class="flex items-center gap-sm text-primary">
<span class="material-symbols-outlined text-[20px]">target</span>
<h2 class="font-headline-md text-headline-md">Goals</h2>
</div>
<button class="flex items-center gap-xs px-3 py-1.5 bg-surface border border-outline-variant hover:bg-surface-variant transition-colors rounded text-primary font-button text-button">
<span class="material-symbols-outlined text-[16px]">add</span>
                    New Goal
                </button>
</div>
<!-- Goal Item -->
<div class="border border-outline-variant rounded p-md flex flex-col gap-sm relative overflow-hidden group">
<!-- Status bar top accent (optional, but nice for 'achieved' state) -->
<div class="absolute top-0 left-0 w-full h-1 bg-primary"></div>
<div class="flex justify-between items-center pt-xs">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined text-primary">emoji_events</span>
<h3 class="font-button text-button text-primary">Weekly Hours: 2h</h3>
<span class="px-2 py-0.5 bg-surface-container-high rounded font-label-mono text-[10px] text-secondary">Sep 2, 2026</span>
</div>
<div class="flex items-center gap-sm">
<span class="font-label-mono text-label-mono text-primary">2.9/2 (100%)</span>
<button class="text-outline hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
<span class="material-symbols-outlined text-[16px]">close</span>
</button>
</div>
</div>
<!-- Progress Bar Container -->
<div class="w-full h-2 bg-surface-variant rounded-full mt-xs overflow-hidden">
<div class="h-full bg-primary" style="width: 100%;"></div>
</div>
<p class="font-body-md text-[13px] text-secondary mt-xs">
                    Goal achieved! Check your email for confirmation.
                </p>
</div>
<!-- Can add more goal items here following same structure -->
</div>
</main>
<!-- Footer -->
<footer class="w-full py-xl bg-surface dark:bg-surface border-t border-outline-variant dark:border-outline-variant opacity-80 hover:opacity-100 transition-all duration-100 mt-auto relative z-10">
<div class="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-max-width mx-auto gap-md">
<!-- Copyright -->
<div class="font-label-mono text-label-mono text-secondary">
                © 2024 cadence. Built for precision.
            </div>
<!-- Links -->
<div class="flex items-center gap-md font-body-md text-body-md">
<a class="text-secondary hover:text-primary dark:hover:text-on-primary-fixed transition-colors duration-100" href="#">
                    Privacy
                </a>
<a class="text-secondary hover:text-primary dark:hover:text-on-primary-fixed transition-colors duration-100" href="#">
                    Terms
                </a>
<a class="text-secondary hover:text-primary dark:hover:text-on-primary-fixed transition-colors duration-100" href="#">
                    API
                </a>
<a class="text-secondary hover:text-primary dark:hover:text-on-primary-fixed transition-colors duration-100" href="#">
                    Support
                </a>
</div>
</div>
</footer>
</body></html>