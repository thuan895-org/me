/* All page copy lives here. Edit text in BOTH `en` and `vi`. Keys must match data-i18n attributes in index.html. */
const ROOMS = ["migration", "cpaas", "ai"];
const EXT = { migration: "EXT 101", cpaas: "EXT 102", ai: "EXT 103" };

const T = {
  en: {
    status: "Line open · taking part-time & freelance work",
    contactBtn: "Contact",
    prompt: "Select an extension to connect",
    n_migration: "Migration", n_cpaas: "Telecom", n_ai: "AI agents",
    connected: "Connected", back: "Back to stage", next: "Next extension",
    stackLabel: "Stack",
    e_about: "Profile",
    summary: "Backend engineer with <b>5+ years</b> of experience, including <b>4 years</b> building a cloud communications platform for businesses in several countries. I led the migration of <b>4+ Java microservices to NestJS</b> in production, and I build <b>MCP servers</b> that let AI agents work on real systems.",
    e_log: "Call log", t_log: "Experience",
    e_cert: "Credentials", t_cert: "Certifications",
    e_contact: "Dial in", t_contact: "Let's talk",
    phone: "Phone", copy: "Copy", copied: "Copied",
    rooms: {
      migration: {
        title: "Led the move from Java to NestJS",
        lede: "At Hoiio I led the migration of 4+ Java/Spring Boot microservices to Node.js and TypeScript, from the first architecture decisions to production traffic.",
        points: ["Chose NestJS for its closeness to Spring Boot, so the team kept familiar patterns.", "Rebuilt data access on MySQL with TypeORM and environment-based configuration.", "All 4+ services now run in production."],
        outLabel: "Outcomes",
        out: ["Lower server resource use", "Faster feature delivery", "One stack for the team"],
        stack: ["Java", "Spring Boot", "Node.js", "TypeScript", "NestJS", "TypeORM", "MySQL", "Docker", "Kubernetes"]
      },
      cpaas: {
        title: "Four years inside a cloud communications platform",
        lede: "Hoiio provides voice, messaging and contact-center services to businesses in several countries. I build the backend that keeps those lines working.",
        points: ["Outbound call campaigns and auto-dialer", "IVR menus and call routing", "Call recording and reporting", "Fax, SMS and RCS messaging", "Customer-facing APIs and webhooks", "Production performance fixes and incident response"],
        outLabel: "Also",
        out: ["Code reviews", "Mentoring new engineers"],
        stack: ["AWS", "Kafka", "RabbitMQ", "Redis", "Microservices", "REST", "Webhooks"]
      },
      ai: {
        title: "AI agents that act on real systems",
        lede: "I build MCP (Model Context Protocol) servers that let AI agents operate on the platform, not just talk about it.",
        points: ["MCP servers that let agents perform operations on the CPaaS platform", "Internal tools so agents support day-to-day development", "AI-assisted engineering with Claude Code as a daily workflow"],
        outLabel: "Open for",
        out: ["AI integration projects for small businesses"],
        stack: ["MCP", "LLM integration", "Claude Code", "NestJS", "TypeScript"]
      }
    },
    log: [
      { when: "Oct 2022 — Present", role: "Software Developer", org: "Hoiio · Remote", note: "Backend for a cloud communications (CPaaS) platform. Led the Java-to-NestJS migration and built MCP servers for AI agents." },
      { when: "Jun 2021 — Oct 2022", role: "Mobile Application Developer", org: "FPT Software · Da Nang", note: "Retail and commerce mobile apps for Japanese clients, built with React Native and Java." },
      { when: "2018 — 2022", role: "B.S. Software Engineering", org: "FPT University", note: "" }
    ]
  },
  vi: {
    status: "Đang nhận việc part-time & freelance",
    contactBtn: "Liên hệ",
    prompt: "Chọn một máy nhánh để kết nối",
    n_migration: "Migration", n_cpaas: "Tổng đài", n_ai: "AI agent",
    connected: "Đã kết nối", back: "Quay lại sân khấu", next: "Máy nhánh tiếp theo",
    stackLabel: "Công nghệ",
    e_about: "Giới thiệu",
    summary: "Kỹ sư backend với <b>hơn 5 năm</b> kinh nghiệm, trong đó <b>4 năm</b> xây dựng nền tảng liên lạc đám mây cho doanh nghiệp ở nhiều quốc gia. Tôi dẫn dắt việc chuyển <b>hơn 4 microservice Java sang NestJS</b> đã chạy production, và xây <b>MCP server</b> giúp AI agent làm việc trên hệ thống thật.",
    e_log: "Nhật ký", t_log: "Kinh nghiệm",
    e_cert: "Chứng nhận", t_cert: "Chứng chỉ",
    e_contact: "Gọi vào", t_contact: "Kết nối với tôi",
    phone: "Điện thoại", copy: "Sao chép", copied: "Đã chép",
    rooms: {
      migration: {
        title: "Dẫn dắt chuyển đổi từ Java sang NestJS",
        lede: "Tại Hoiio, tôi dẫn dắt việc chuyển hơn 4 microservice Java/Spring Boot sang Node.js và TypeScript, từ các quyết định kiến trúc đầu tiên đến khi chạy production.",
        points: ["Chọn NestJS vì gần với Spring Boot, giúp team giữ được cách làm quen thuộc.", "Xây lại tầng dữ liệu trên MySQL với TypeORM và cấu hình theo môi trường.", "Toàn bộ hơn 4 service đã chạy production."],
        outLabel: "Kết quả",
        out: ["Giảm tài nguyên server", "Ra tính năng nhanh hơn", "Một stack thống nhất cho team"],
        stack: ["Java", "Spring Boot", "Node.js", "TypeScript", "NestJS", "TypeORM", "MySQL", "Docker", "Kubernetes"]
      },
      cpaas: {
        title: "Bốn năm xây nền tảng liên lạc đám mây",
        lede: "Hoiio cung cấp dịch vụ thoại, tin nhắn và tổng đài chăm sóc khách hàng cho doanh nghiệp ở nhiều quốc gia. Tôi xây phần backend giữ cho các đường dây đó hoạt động.",
        points: ["Chiến dịch gọi ra và auto-dialer", "IVR và định tuyến cuộc gọi", "Ghi âm và báo cáo cuộc gọi", "Gửi fax, SMS và RCS", "API và webhook cho khách hàng", "Tối ưu hiệu năng và xử lý sự cố production"],
        outLabel: "Ngoài ra",
        out: ["Review code", "Kèm kỹ sư mới"],
        stack: ["AWS", "Kafka", "RabbitMQ", "Redis", "Microservices", "REST", "Webhooks"]
      },
      ai: {
        title: "AI agent thao tác trên hệ thống thật",
        lede: "Tôi xây MCP (Model Context Protocol) server để AI agent thực hiện thao tác trên nền tảng, không chỉ trò chuyện.",
        points: ["MCP server cho phép agent thực hiện thao tác trên nền tảng CPaaS", "Công cụ nội bộ để agent hỗ trợ công việc phát triển hằng ngày", "Phát triển phần mềm cùng Claude Code mỗi ngày"],
        outLabel: "Đang nhận",
        out: ["Dự án tích hợp AI cho doanh nghiệp nhỏ"],
        stack: ["MCP", "Tích hợp LLM", "Claude Code", "NestJS", "TypeScript"]
      }
    },
    log: [
      { when: "10/2022 — Nay", role: "Software Developer", org: "Hoiio · Remote", note: "Backend cho nền tảng liên lạc đám mây (CPaaS). Dẫn dắt chuyển đổi Java sang NestJS và xây MCP server cho AI agent." },
      { when: "06/2021 — 10/2022", role: "Mobile Application Developer", org: "FPT Software · Đà Nẵng", note: "Ứng dụng di động bán lẻ, thương mại cho khách hàng Nhật, dùng React Native và Java." },
      { when: "2018 — 2022", role: "Cử nhân Kỹ thuật phần mềm", org: "Đại học FPT", note: "" }
    ]
  }
};
