// Central place for placeholder identity/contact info.
// Swap these values (and /public/cv/resume.pdf, social URLs) with real ones before launch.
export const SITE = {
  name: "Alex Christopher",
  role: "AI Engineer — Computer Vision & Data Automation",
  email: "alex.christopher97@gmail.com",
  location: "Surabaya, Indonesia",
  relocation: "Open to relocate to Malaysia · EP-eligible",
  social: {
    github: "https://github.com/spraygospel",
    linkedin: "https://www.linkedin.com/in/alex-christopher97/",
  },
  resumeUrl: "/cv/resume.pdf",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/work/agentic-erp", label: "Agentic ERP AI" },
  { href: "/work/vision-kpi", label: "Vision KPI" },
  { href: "/about", label: "About" },
] as const;
