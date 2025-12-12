<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=00f260&height=220&section=header&text=RANKIFY&fontSize=90&animation=fadeIn&fontAlignY=38&desc=AI%20Powered%20Mock%20Test%20Scanner&descAlignY=55&descAlign=62&fontColor=0f172a" alt="Rankify Header" width="100%"/>
</div>

<div align="center">
  <br />
    <a href="https://react.dev">
        <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=white" alt="React" />
    </a>
    <a href="https://ai.google.dev/">
        <img src="https://img.shields.io/badge/Gemini-3.0_Pro-purple?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
    </a>
    <a href="https://tailwindcss.com/">
        <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
    </a>
    <a href="https://www.typescriptlang.org/">
        <img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    </a>
  <br />
  <br />
  <p align="center">
    <b style="font-size: 24px;">Turn Static PDFs into Interactive Exams Instantly</b>
  </p>
</div>

<hr />

## 🚀 **What is Rankify?**

**Rankify** is a next-generation web application designed for **JEE/NEET aspirants**. It leverages the cutting-edge **Multimodal capabilities of Gemini 3.0** to visually scan entire PDF mock tests, extract complex questions (including diagrams, chemical formulas, and mathematical equations), and convert them into a **Computer Based Test (CBT)** interface in real-time.

> *No more manual data entry. Just upload, scan, and practice.*

---

## 💎 **Key Features**

| Feature | Description |
| :--- | :--- |
| **🧠 Multimodal AI Scanning** | Visually identifies questions, options, and **bounding boxes for diagrams** directly from PDF pages. |
| **⚡ Instant Digitization** | Converts static PDF files into a fully interactive, timed quiz environment within seconds. |
| **📐 LaTeX & Math Support** | Perfectly renders complex mathematical equations ($E=mc^2$) and chemical formulas. |
| **🤖 AI Solver** | Stuck on a question? One click generates a **detailed, step-by-step solution** using Gemini 3.0. |
| **📊 Smart Analytics** | Get a detailed performance report with accuracy charts, time analysis, and question breakdowns. |
| **🎨 Cyber-Dark UI** | A stunning, glassmorphism-inspired dark mode interface built for focus and aesthetics. |

---

## 📸 **Visual Tour**

<table>
  <tr>
    <td align="center">
      <h3>📂 The Upload</h3>
      <p>Drag & Drop interface with asymptotic progress animation</p>
    </td>
    <td align="center">
      <h3>📝 The Exam Hall</h3>
      <p>Split-screen view with PDF diagrams & interactive options</p>
    </td>
  </tr>
  <tr>
    <td align="center">
       <h3>📊 The Report Card</h3>
       <p>Bento-grid style analytics & AI-generated solutions</p>
    </td>
    <td align="center">
       <h3>🔍 Deep Zoom</h3>
       <p>High-res canvas rendering for complex figures</p>
    </td>
  </tr>
</table>

---

## 🛠️ **Tech Stack**

<div align="center">
  <img src="https://skillicons.dev/icons?i=react,ts,tailwind,vite,github" />
  <br/>
  <img src="https://skillicons.dev/icons?i=gcp,nodejs,html,css" />
</div>

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS, GSAP (Animations), Lucide React (Icons)
- **AI Engine**: Google Gemini API (`gemini-3-pro-preview`)
- **PDF Processing**: PDF.js
- **Math Rendering**: KaTeX, Remark/Rehype
- **Charts**: Recharts

---

## ⚡ **Getting Started**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/rankify.git
cd rankify
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory and add your Google Gemini API key:
```env
API_KEY=your_google_gemini_api_key_here
```
> **Note**: You need a paid tier project or an active trial for `gemini-3-pro-preview`.

### 4. Run the App
```bash
npm start
```
The app will launch at `http://localhost:1234` (or your configured port).

---

## 🔮 **How It Works**

1.  **User uploads a PDF** (Mock test, question paper).
2.  **PDF.js** converts pages to base64 images/text.
3.  **Gemini 3.0** receives the multimodal prompt (PDF data + Instructions).
4.  **AI Extraction**: The model identifies:
    *   Question text (mapped to LaTeX).
    *   Option text.
    *   **Visual Bounding Boxes** for diagrams (coordinates on the page).
    *   Correct answer & Explanation.
5.  **React Engine** constructs the Quiz State.
6.  **Interactive Quiz**: User takes the test with a timer.
7.  **Result Generation**: Score calculation and detailed breakdown.

---

## 🎨 **Design Philosophy**

Rankify uses a **"Cyber-Academic"** aesthetic:
- **Colors**: Slate-950 backgrounds with Emerald-500 accents.
- **Typography**: Inter for UI, JetBrains Mono for code/math/data.
- **Motion**: GSAP-powered entrance animations and asymptotic loaders.
- **Glassmorphism**: Subtle translucent layers for depth.

---

<div align="center">
  <h3>Built with ❤️ for Students</h3>
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0f172a&height=100&section=footer" width="100%"/>
</div>