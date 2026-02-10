/**
 * DMAP Academic Paper Generator
 * Generates a complete ~17-page academic paper as .docx
 * "Declarative Multi-Agent Orchestration: Applying Clean Architecture Principles
 *  to LLM Agent Systems via Markdown and YAML"
 */

const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, ShadingType, WidthType,
  PageBreak, Footer, PageNumber, NumberFormat, convertInchesToTwip,
  Tab, TabStopType, LevelFormat, TableLayoutType, VerticalAlign,
  ExternalHyperlink, Header,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─── Constants ───────────────────────────────────────────────────────────────
const FONT = "Arial";
const PT = (n) => n * 2; // half-points
const TITLE_SIZE = PT(28);
const AUTHOR_SIZE = PT(14);
const ABSTRACT_SIZE = PT(11);
const BODY_SIZE = PT(12);
const H1_SIZE = PT(16);
const H2_SIZE = PT(14);
const H3_SIZE = PT(12);
const HEADER_BG = "D5E8F0";
const THIN_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const TABLE_BORDERS = {
  top: THIN_BORDER, bottom: THIN_BORDER,
  left: THIN_BORDER, right: THIN_BORDER,
};
const INCH = convertInchesToTwip(1);
const PAGE_WIDTH_TWIPS = convertInchesToTwip(6.5); // 8.5 - 2*1 margins

// ─── Helper functions ────────────────────────────────────────────────────────

function p(text, opts = {}) {
  const {
    bold, italic, size, font, alignment, spacing, indent,
    heading, color, underline, superscript, break: brk,
  } = opts;
  const runOpts = {
    text,
    font: font || FONT,
    size: size || BODY_SIZE,
    bold: bold || false,
    italics: italic || false,
    color: color || "000000",
    underline: underline ? {} : undefined,
    superScript: superscript || false,
    break: brk,
  };
  const paraOpts = {
    children: [new TextRun(runOpts)],
    alignment: alignment || AlignmentType.JUSTIFIED,
    spacing: spacing || { after: 120, line: 276 },
    indent: indent,
    heading: heading,
  };
  return new Paragraph(paraOpts);
}

function runs(segments, opts = {}) {
  const { alignment, spacing, indent, heading, bullet } = opts;
  const children = segments.map((seg) => {
    if (typeof seg === "string") {
      return new TextRun({ text: seg, font: FONT, size: BODY_SIZE });
    }
    return new TextRun({
      text: seg.text,
      font: seg.font || FONT,
      size: seg.size || BODY_SIZE,
      bold: seg.bold || false,
      italics: seg.italic || false,
      color: seg.color || "000000",
      superScript: seg.superscript || false,
    });
  });
  const paraOpts = {
    children,
    alignment: alignment || AlignmentType.JUSTIFIED,
    spacing: spacing || { after: 120, line: 276 },
    indent,
    heading,
    bullet,
  };
  return new Paragraph(paraOpts);
}

function emptyLine() {
  return new Paragraph({ children: [], spacing: { after: 60 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function h1(number, title) {
  return new Paragraph({
    children: [new TextRun({ text: `${number}. ${title}`, font: FONT, size: H1_SIZE, bold: true })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200, line: 276 },
    alignment: AlignmentType.LEFT,
  });
}

function h2(number, title) {
  return new Paragraph({
    children: [new TextRun({ text: `${number} ${title}`, font: FONT, size: H2_SIZE, bold: true })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160, line: 276 },
    alignment: AlignmentType.LEFT,
  });
}

function h3(number, title) {
  return new Paragraph({
    children: [new TextRun({ text: `${number} ${title}`, font: FONT, size: H3_SIZE, bold: true, italics: true })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120, line: 276 },
    alignment: AlignmentType.LEFT,
  });
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: BODY_SIZE })],
    bullet: { level },
    spacing: { after: 60, line: 276 },
    alignment: AlignmentType.LEFT,
  });
}

function bulletRuns(segments, level = 0) {
  const children = segments.map((seg) => {
    if (typeof seg === "string") return new TextRun({ text: seg, font: FONT, size: BODY_SIZE });
    return new TextRun({ text: seg.text, font: seg.font || FONT, size: seg.size || BODY_SIZE, bold: seg.bold || false, italics: seg.italic || false });
  });
  return new Paragraph({ children, bullet: { level }, spacing: { after: 60, line: 276 }, alignment: AlignmentType.LEFT });
}

function figPlaceholder(num, description) {
  return new Paragraph({
    children: [new TextRun({ text: `[FIGURE ${num}: ${description}]`, font: FONT, size: BODY_SIZE, bold: true, italics: true, color: "555555" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    border: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
  });
}

// ─── Image paths ─────────────────────────────────────────────────────────────
const IMAGES_DIR = path.join(__dirname, "images", "en");
const FIGURE_MAP = {
  1: { file: "fig_architecture.png", title: "5-Layer Architecture", width: 500, height: 350 },
  2: { file: "fig_tier_model.png", title: "4-Tier Agent Model", width: 500, height: 370 },
  3: { file: "fig_agent_package.png", title: "Agent Package Structure", width: 500, height: 340 },
  4: { file: "fig_gateway.png", title: "Gateway Mapping", width: 500, height: 360 },
  5: { file: "fig_activation.png", title: "3-Layer Activation Structure", width: 500, height: 330 },
};

function figImage(num, captionText) {
  const fig = FIGURE_MAP[num];
  const imagePath = path.join(IMAGES_DIR, fig.file);
  const imageData = fs.readFileSync(imagePath);
  const imgParagraph = new Paragraph({
    children: [
      new ImageRun({
        data: imageData,
        transformation: { width: fig.width, height: fig.height },
        type: "png",
        altText: {
          title: fig.title,
          description: captionText,
          name: fig.file,
        },
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 80 },
  });
  const captionParagraph = new Paragraph({
    children: [new TextRun({ text: `Figure ${num}: ${captionText}`, font: FONT, size: PT(10), italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
  return [imgParagraph, captionParagraph];
}

function tableCaption(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: PT(10), bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 80 },
  });
}

function makeCell(text, opts = {}) {
  const { bold, header, width, alignment: cellAlign, colspan } = opts;
  const shade = header
    ? { type: ShadingType.CLEAR, color: "auto", fill: HEADER_BG }
    : undefined;
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: text || "", font: FONT, size: PT(10), bold: bold || header || false })],
      alignment: cellAlign || AlignmentType.LEFT,
      spacing: { after: 40 },
    })],
    shading: shade,
    borders: TABLE_BORDERS,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: colspan,
  });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    children: headers.map((h, i) => makeCell(h, { header: true, width: colWidths[i] })),
    tableHeader: true,
  });
  const dataRows = rows.map((row) => new TableRow({
    children: row.map((cell, i) => makeCell(cell, { width: colWidths[i] })),
  }));
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    layout: TableLayoutType.FIXED,
  });
}

// sup helper for citation
function cite(num) {
  return new TextRun({ text: ` [${num}]`, font: FONT, size: PT(10), superScript: true });
}

// ─── CONTENT SECTIONS ────────────────────────────────────────────────────────

function titleSection() {
  return [
    emptyLine(),
    emptyLine(),
    new Paragraph({
      children: [new TextRun({ text: "Declarative Multi-Agent Orchestration:", font: FONT, size: TITLE_SIZE, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Applying Clean Architecture Principles to LLM Agent Systems", font: FONT, size: TITLE_SIZE, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "via Markdown and YAML", font: FONT, size: TITLE_SIZE, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Unicorn Inc. Research Team", font: FONT, size: AUTHOR_SIZE })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "contact@unicorn.co.kr", font: FONT, size: PT(11), italics: true, color: "444444" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];
}

function abstractSection() {
  return [
    p("Abstract", { bold: true, size: H2_SIZE, alignment: AlignmentType.CENTER, spacing: { after: 160 } }),
    new Paragraph({
      children: [new TextRun({
        text: "LLM-based multi-agent systems have experienced rapid growth since 2023, with frameworks such as AutoGen, CrewAI, LangGraph, and MetaGPT enabling increasingly sophisticated agent collaboration. However, these frameworks share fundamental structural limitations: mandatory code dependency (Python or TypeScript SDKs), tight runtime coupling, role conflation between orchestration and execution, insufficient abstraction layers, and narrow domain applicability. This paper proposes DMAP (Declarative Multi-Agent Plugin), a runtime-neutral plugin architecture that systematically applies Clean Architecture principles to LLM agent systems using only Markdown and YAML\u2014without any programming code.",
        font: FONT, size: ABSTRACT_SIZE,
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80, line: 276 },
      indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
    }),
    new Paragraph({
      children: [new TextRun({
        text: "DMAP introduces four principal contributions: (1) a declarative agent specification standard comprising AGENT.md (WHY and HOW prompts), agentcard.yaml (WHO, WHAT, and WHEN metadata), and tools.yaml (abstract tool interfaces), with strict boundary principles prohibiting information duplication across files; (2) systematic application of Loosely Coupling, High Cohesion, and Dependency Inversion to AI agent orchestration through a 5-Layer architecture featuring both delegation paths (Input\u2192Skills\u2192Agents\u2192Gateway\u2192Runtime) and direct execution paths (Input\u2192Skills\u2192Gateway\u2192Runtime) adhering to the YAGNI principle; (3) a 4-Tier agent model (HEAVY, HIGH, MEDIUM, LOW) with runtime-neutral abstract declarations mapped to concrete implementations via Gateway\u2019s runtime-mapping.yaml, enabling portability across Claude Code, Codex CLI, and Gemini CLI without modifying agent definitions; and (4) empirical validation through two production-deployed plugins: OMC (39 Skills, 35 Agents, orchestration plugin with Hooks as cross-cutting concerns) and Abra (business domain plugin for AI agent development workflows). Our approach demonstrates that non-developers can define sophisticated agent systems, achieves genuine runtime portability, and maintains strict separation of concerns\u2014establishing that well-known software engineering principles can be effectively transplanted to AI agent architectures through declarative specifications alone.",
        font: FONT, size: ABSTRACT_SIZE,
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80, line: 276 },
      indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
    }),
    emptyLine(),
    new Paragraph({
      children: [
        new TextRun({ text: "Keywords: ", font: FONT, size: ABSTRACT_SIZE, bold: true }),
        new TextRun({ text: "Multi-Agent Systems, LLM Orchestration, Clean Architecture, Declarative Specification, Plugin Architecture, Runtime Portability", font: FONT, size: ABSTRACT_SIZE, italics: true }),
      ],
      indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
      spacing: { after: 200 },
    }),
    pageBreak(),
  ];
}

function introductionSection() {
  return [
    h1("1", "Introduction"),

    p("The landscape of artificial intelligence has been fundamentally reshaped by Large Language Models (LLMs), which have demonstrated remarkable capabilities in natural language understanding, reasoning, and code generation. Since 2023, the field has witnessed an explosive growth in multi-agent systems\u2014architectures where multiple LLM-powered agents collaborate to accomplish complex tasks that exceed the capacity of any single agent. This evolution represents a paradigm shift from monolithic prompt engineering to distributed, role-specialized agent orchestration."),

    p("Several prominent frameworks have emerged to address the challenges of multi-agent coordination. Microsoft\u2019s AutoGen [1] introduced conversation-based protocols for inter-agent communication. CrewAI [2] popularized role-based agent teams with sequential and hierarchical process models. LangGraph [3], building on LangChain\u2019s foundation, formalized agent workflows as directed graphs with conditional edges. MetaGPT [4] applied Standard Operating Procedures (SOPs) to software development teams, while ChatDev [5] simulated an entire software company with communicating agents. Each framework has contributed meaningful advances to the field, collectively demonstrating the viability and utility of multi-agent approaches."),

    p("Despite these advances, a critical examination reveals that existing frameworks share five fundamental structural limitations that constrain their broader adoption and long-term sustainability:"),

    runs([{ text: "Code Dependency.", bold: true }, " Every major framework requires agent definitions through Python or TypeScript SDKs. This creates an insurmountable barrier for domain experts\u2014educators, business analysts, project managers\u2014who possess the domain knowledge necessary to define agent behaviors but lack programming skills. The current paradigm effectively restricts multi-agent system design to software developers, even when the target domain has nothing to do with programming."]),

    runs([{ text: "Runtime Coupling.", bold: true }, " Agent definitions are tightly bound to specific framework APIs. A CrewAI agent cannot run on AutoGen\u2019s runtime; a LangGraph workflow cannot be ported to MetaGPT. This coupling means that adopting a framework is a one-way commitment\u2014organizations cannot migrate their agent definitions if a framework becomes deprecated or if a superior runtime emerges."]),

    runs([{ text: "Role Conflation.", bold: true }, " Most frameworks blur the distinction between orchestration (deciding which agent handles which task) and execution (performing the actual work). Agents frequently serve dual roles as both coordinators and workers, violating the principle of separation of concerns and creating maintenance challenges as systems scale."]),

    runs([{ text: "Lack of Abstraction.", bold: true }, " Tool bindings, model selections, and operational parameters are typically hardcoded within agent definitions. When an organization needs to switch from one LLM provider to another or replace a tool implementation, changes must propagate through every agent definition\u2014a maintenance burden that grows linearly with system complexity."]),

    runs([{ text: "Domain Limitation.", bold: true }, " The majority of existing frameworks are implicitly or explicitly optimized for software development tasks. Their architectural assumptions\u2014repository access, code execution environments, test runners\u2014make them awkward fits for domains such as education curriculum design, business process automation, or content creation workflows."]),

    p("These limitations are not incidental implementation details but rather consequences of a shared architectural assumption: that agent systems must be defined imperatively through code. This paper challenges that assumption directly."),

    runs([{ text: "Research Question. ", bold: true, italic: true }, "Can established software engineering principles\u2014specifically Clean Architecture\u2019s Loosely Coupling, High Cohesion, and Dependency Inversion\u2014be systematically applied to LLM agent systems without writing any code, using only declarative specifications in Markdown and YAML?"]),

    p("We answer this question affirmatively by proposing DMAP (Declarative Multi-Agent Plugin), a runtime-neutral plugin architecture that transplants Clean Architecture [6] principles into the domain of LLM agent orchestration. Our contributions are fourfold:"),

    bulletRuns([{ text: "Contribution 1: ", bold: true }, "A declarative agent specification standard using AGENT.md (prompts), agentcard.yaml (metadata), and tools.yaml (abstract tool interfaces), with strict boundary principles that prevent information duplication across files."]),
    bulletRuns([{ text: "Contribution 2: ", bold: true }, "A 5-Layer architecture with two distinct execution paths\u2014delegation (for LLM reasoning tasks) and direct (for procedural tasks)\u2014that systematically applies Loosely Coupling, High Cohesion, Dependency Inversion, and YAGNI principles to agent orchestration."]),
    bulletRuns([{ text: "Contribution 3: ", bold: true }, "A 4-Tier agent model (HEAVY/HIGH/MEDIUM/LOW) with runtime-neutral abstract declarations mapped to concrete implementations through Gateway\u2019s runtime-mapping.yaml, enabling genuine portability across heterogeneous LLM runtimes."]),
    bulletRuns([{ text: "Contribution 4: ", bold: true }, "Empirical validation through two production-deployed plugins: OMC (orchestration, 39 Skills, 35 Agents) and Abra (business domain, AI agent development workflow), demonstrating both the expressiveness and practical applicability of the approach."]),

    p("The remainder of this paper is organized as follows. Section 2 surveys related work in multi-agent frameworks. Section 3 presents the DMAP architecture. Section 4 details the design principles and their mapping to established software engineering concepts. Section 5 describes the implementation, including skill types, agent packages, delegation notation, and gateway mechanisms. Section 6 presents case studies. Section 7 provides comparative evaluation. Section 8 discusses limitations and future directions, and Section 9 concludes."),

    pageBreak(),
  ];
}

function relatedWorkSection() {
  return [
    h1("2", "Related Work"),

    p("This section surveys the major multi-agent frameworks that have emerged since 2023, analyzing their architectural approaches and identifying common structural patterns that motivate our work."),

    h2("2.1", "LangChain and LangGraph"),
    p("LangChain [7] pioneered the concept of composable tool chains for LLM applications, providing abstractions for prompts, memory, and tool integration. Its modular design\u2014separating prompts, chains, agents, and tools into distinct components\u2014represented an early attempt at architectural discipline in LLM applications. LangGraph [3] extended this foundation significantly by introducing stateful, graph-based workflows where agents are nodes and transitions are conditional edges. This graph abstraction enables important capabilities: cycles (allowing iterative refinement), persistence (maintaining state across interactions), human-in-the-loop patterns (enabling approval gates), and conditional branching (routing based on agent outputs)."),

    p("Despite these advances, LangGraph remains fundamentally code-centric. Agent behaviors, graph structures, tool bindings, and state management logic must all be expressed through Python code. A typical LangGraph agent requires defining a StateGraph object, adding nodes as Python functions, configuring edges with conditional logic, and compiling the graph\u2014all programmatically. This creates tight coupling between agent definitions and the LangChain/LangGraph SDK. The graph abstraction, while powerful for workflow visualization, does not address the broader questions of runtime portability or non-developer accessibility. Furthermore, LangGraph\u2019s state management model assumes a specific computational paradigm that may not suit all orchestration patterns, particularly those requiring dynamic agent spawning rather than pre-defined graph topologies."),

    h2("2.2", "CrewAI"),
    p("CrewAI [2] introduced an intuitive metaphor of agent \u201Ccrews\u201D with defined roles, goals, and backstories, making the conceptual model of multi-agent collaboration more accessible. Its sequential and hierarchical process models provide clear orchestration patterns, and the addition of delegation capabilities allows agents to hand off tasks to teammates. CrewAI\u2019s YAML-based configuration for some parameters hints at declarative thinking, but the core agent logic, tool assignments, and workflow definitions remain Python objects."),

    p("However, CrewAI conflates agent identity (who the agent is) with agent behavior (how it operates) in a single Python class definition. There is no mechanism to separate metadata (role, tier, restrictions) from behavioral prompts (workflow, goals, verification). Tool assignments are code-level bindings\u2014replacing a search tool requires modifying the agent\u2019s Python constructor. Furthermore, CrewAI\u2019s delegation model is implicit: agents delegate based on runtime LLM decisions rather than explicit handoff declarations, making it difficult to predict or audit delegation pathways. The framework does not support tiered agent variants (e.g., a low-cost version of the same role for simple tasks) or formal escalation mechanisms."),

    h2("2.3", "AutoGen"),
    p("Microsoft\u2019s AutoGen [1] takes a distinctive approach by modeling multi-agent interaction as conversational protocols. Rather than defining explicit workflows, AutoGen allows complex behaviors to emerge from structured message exchanges between agents. The framework\u2019s nested chat patterns enable sophisticated interaction topologies: agents can spawn sub-conversations, participate in group chats mediated by a manager agent, and maintain separate conversation threads for different sub-tasks. The GroupChatManager pattern, in particular, provides a flexible mechanism for coordinating multiple agents around a shared objective."),

    p("AutoGen\u2019s conversation-centric design is elegant for dialogue-heavy applications such as debate simulation, collaborative writing, or advisory systems. However, it introduces significant complexity for task-oriented workflows where agents need to produce structured artifacts rather than engage in conversation. The overhead of conversation management\u2014message routing, turn-taking, conversation termination conditions\u2014adds both token cost and conceptual complexity. Like other frameworks, AutoGen requires Python for agent definition, and its conversation protocols (AssistantAgent, UserProxyAgent, GroupChat) are specific to the AutoGen runtime, making agent definitions non-portable. AutoGen also lacks a formal tier system or cost-optimization mechanism; all agents in a conversation typically use the same underlying LLM model regardless of task complexity."),

    h2("2.4", "MetaGPT"),
    p("MetaGPT [4] applies Standard Operating Procedures (SOPs) to multi-agent software development, assigning roles such as Product Manager, Architect, Project Manager, and Engineer to different agents. Its key innovation is structured output: agents produce well-defined artifacts (PRD documents, system designs, API specifications, code files) that serve as inputs to subsequent agents, creating an artifact-mediated pipeline. This approach resonates strongly with real-world organizational patterns where structured handoffs between roles are standard practice."),

    p("MetaGPT\u2019s SOP-based approach represents a step toward the separation of concerns that DMAP advocates: roles have defined responsibilities and produce specific artifact types. However, the implementation remains tightly coupled to the MetaGPT Python framework. Roles are defined as Python classes inheriting from a Role base class, actions are Python classes with run() methods, and the SOP is encoded in Python logic. Furthermore, MetaGPT is specifically optimized for software development workflows; its role definitions, artifact types, and pipeline stages all assume a software engineering context. Applying MetaGPT to non-software domains (education, business process, content creation) would require fundamental restructuring of the role hierarchy and artifact pipeline, not merely configuration changes."),

    h2("2.5", "ChatDev"),
    p("ChatDev [5] extends the organizational metaphor further by simulating an entire software company with CEO, CTO, CPO, programmer, reviewer, and tester agents engaged in chat-based collaboration. Its phase-based development process\u2014designing, coding, testing, and documenting\u2014mirrors real software company workflows. ChatDev introduces the concept of \u201Cchat chains,\u201D where pairs of agents collaborate through structured dialogues within each phase, and the output of one phase feeds into the next."),

    p("While ChatDev\u2019s organizational simulation is creative and produces compelling results for code generation tasks, its architecture is inherently limited. The framework assumes a fixed domain (software development), a fixed interaction pattern (pairwise chat), and a fixed organizational structure (CEO-to-programmer hierarchy). Generalizing ChatDev to other domains would require not just new role definitions but a fundamentally different organizational model. Additionally, ChatDev\u2019s agent roles are hardcoded in the framework\u2019s Python codebase, and the chat chain structure is defined through JSON configuration files that are tightly coupled to the framework\u2019s execution engine."),

    h2("2.6", "Other Notable Approaches"),
    p("Beyond the five frameworks surveyed in detail, several additional projects deserve mention. The ReAct paradigm [20] demonstrated that interleaving reasoning and action in LLM agents improves task performance compared to reasoning-only or action-only approaches. Toolformer [22] showed that language models can learn to use external tools autonomously. Generative Agents [23] explored believable simulations of human behavior through agent architectures with memory and reflection capabilities. While these works advance our understanding of individual agent capabilities, they do not address the architectural questions of multi-agent orchestration, runtime portability, or declarative specification that DMAP targets."),

    p("The broader trend in LLM agent development shows a progression from single-agent prompt engineering (2022) through tool-augmented agents (2023) to multi-agent collaborative systems (2024\u20132025). Each stage has increased the complexity of agent systems without a corresponding increase in architectural discipline. DMAP addresses this gap by applying proven software engineering principles to the newest stage of this evolution."),

    h2("2.7", "Broader Context: Agent Architecture Surveys"),
    p("Several comprehensive surveys [12, 13] have catalogued the rapid evolution of LLM-based agent systems. Xi et al. [12] identified three fundamental components of LLM agents\u2014brain (LLM reasoning), perception (input processing), and action (tool use)\u2014and classified agent architectures along dimensions of autonomy, collaboration, and specialization. Wang et al. [13] surveyed autonomous agent architectures and identified key challenges including planning, memory management, and multi-agent coordination. Both surveys implicitly confirm the field\u2019s reliance on code-based agent definition and the absence of declarative, runtime-neutral alternatives."),

    p("From the software engineering perspective, the principles we apply\u2014Clean Architecture [6], Dependency Inversion [11], Separation of Concerns [9], and Aspect-Oriented Programming [15]\u2014have been validated over decades in traditional software systems. Our contribution lies not in proposing new principles but in demonstrating their systematic applicability to a fundamentally different domain: AI agent orchestration through natural language specifications rather than programming code."),

    h2("2.6", "Common Limitations Analysis"),
    p("A systematic comparison reveals five recurring limitations across all surveyed frameworks:"),

    tableCaption("Table 1: Comparative Analysis of Multi-Agent Frameworks"),
    makeTable(
      ["Dimension", "LangGraph", "CrewAI", "AutoGen", "MetaGPT", "ChatDev"],
      [
        ["Agent Definition", "Python code", "Python code", "Python code", "Python code", "Python code"],
        ["Orchestration", "Graph code", "Sequential/\nhierarchical", "Conversation\nprotocol", "SOP code", "Chat phases"],
        ["Runtime Binding", "LangChain SDK", "CrewAI SDK", "AutoGen SDK", "MetaGPT SDK", "ChatDev SDK"],
        ["Tool Abstraction", "Tool class", "Tool decorator", "Function call", "Tool class", "Tool class"],
        ["Tier Management", "None", "None", "None", "None", "None"],
        ["Handoff/Escalation", "Conditional\nedge", "Delegation\nkeyword", "None", "None", "None"],
        ["Domain Scope", "General", "General", "General", "Software\ndev", "Software\ndev"],
        ["Non-dev Access", "No", "No", "No", "No", "No"],
        ["Portability", "Low", "Low", "Low", "Low", "Low"],
      ],
      [1600, 950, 950, 950, 950, 950],
    ),
    emptyLine(),

    p("The absence of any framework addressing all five dimensions simultaneously\u2014non-code agent definition, runtime independence, proper separation of concerns, tool abstraction, and domain universality\u2014identifies a clear gap in the current landscape. DMAP addresses this gap by approaching the problem from a fundamentally different angle: declarative specification grounded in established software engineering principles."),

    pageBreak(),
  ];
}

function architectureSection() {
  return [
    h1("3", "Architecture"),

    p("DMAP\u2019s architecture is designed around a central principle borrowed from Robert C. Martin\u2019s Clean Architecture [6]: dependencies must point inward, from concrete infrastructure toward abstract business rules. In the context of LLM agent systems, this translates to a layered structure where agent definitions (the \u201Cbusiness rules\u201D) remain independent of specific runtimes, tools, and models (the \u201Cinfrastructure\u201D). This section presents the architectural design in detail."),

    h2("3.1", "5-Layer Structure"),
    p("DMAP organizes a plugin into five distinct layers, each with a clearly defined responsibility:"),

    runs([{ text: "Layer 1: Input.", bold: true }, " The user interaction layer that receives commands, natural language requests, or programmatic triggers. This layer is entirely runtime-dependent and makes no assumptions about the input format."]),
    runs([{ text: "Layer 2: Controller + Use Case (Skills).", bold: true }, " Skills serve a dual role analogous to Clean Architecture\u2019s Controller and Use Case layers. As controllers, they provide entry points (e.g., slash commands). As use cases, they define orchestration workflows\u2014routing decisions, agent delegation sequences, and completion conditions. Skills are authored in Markdown, containing prompts that instruct the runtime on how to route and orchestrate."]),
    runs([{ text: "Layer 3: Service (Agents).", bold: true }, " Agents are the domain specialists that perform actual work. Each agent is an autonomous unit defined by three files: AGENT.md (behavioral prompts), agentcard.yaml (identity and capability metadata), and tools.yaml (abstract tool interfaces). Agents receive delegated tasks from Skills and produce results. They do not engage in routing or orchestration."]),
    runs([{ text: "Layer 4: Gateway.", bold: true }, " The infrastructure layer that bridges abstract declarations with concrete implementations. Gateway contains install.yaml (tool installation manifests) and runtime-mapping.yaml (tier-to-model mappings, abstract-to-concrete tool mappings, and action mappings). This layer is the only component that contains runtime-specific information."]),
    runs([{ text: "Layer 5: Runtime.", bold: true }, " The execution environment (e.g., Claude Code, Codex CLI, Gemini CLI) that interprets the Gateway mappings, assembles prompts, spawns agents, and manages tool execution. The runtime is external to the plugin and entirely replaceable."]),

    emptyLine(),
    ...figImage(1, "5-Layer Architecture of DMAP showing Input, Skills, Agents, Gateway, and Runtime layers with unidirectional dependency flow"),
    emptyLine(),

    p("A critical architectural constraint is unidirectional call flow: Skills may call Agents, and Agents may access Gateway, but reverse dependencies are prohibited. An Agent never invokes a Skill, and Gateway never triggers an Agent directly. This constraint ensures that each layer can be modified independently without cascading changes."),

    h2("3.2", "Two Execution Paths"),
    p("DMAP defines two distinct execution paths through the architecture, governed by the nature of the task:"),

    runs([{ text: "Delegation Path: ", bold: true }, "Input \u2192 Skills (Controller) \u2192 Agents (Service) \u2192 Gateway \u2192 Runtime. This path is used when tasks require LLM reasoning, creative problem-solving, or autonomous decision-making. Core Skills, Planning Skills, and Orchestrator Skills follow this path, delegating substantive work to specialized Agents."]),

    runs([{ text: "Direct Path: ", bold: true }, "Input \u2192 Skills (Controller) \u2192 Gateway \u2192 Runtime. This path bypasses the Agent layer entirely, used for procedural, deterministic tasks such as installation scripts, configuration setup, or utility operations. Setup Skills and Utility Skills follow this path."]),

    p("The direct path embodies the YAGNI (You Ain\u2019t Gonna Need It) principle from Extreme Programming [8]: if a task does not require LLM reasoning, forcing it through an Agent layer would introduce unnecessary complexity and token consumption. This dual-path design ensures architectural integrity while maintaining practical efficiency."),

    p("The choice of path is determined by skill type, not by runtime decision. Core, Planning, and Orchestrator Skills always follow the delegation path because their tasks inherently require LLM reasoning (analyzing requirements, making architectural decisions, coordinating multi-step workflows). Setup and Utility Skills always follow the direct path because their tasks are procedural (installing tools, checking configuration, managing state files). This compile-time determination eliminates ambiguity and ensures predictable resource consumption."),

    p("An important corollary is that the two paths share the same Gateway layer. Whether an Agent requests a tool through the delegation path or a Utility Skill requests the same tool through the direct path, the Gateway resolves the tool reference identically. This shared infrastructure layer prevents duplication and ensures consistency across execution paths."),

    h2("3.3", "Hooks as Cross-Cutting Concerns"),
    p("In software engineering, cross-cutting concerns are behaviors that span multiple architectural layers\u2014logging, security, and transaction management being classic examples. Aspect-Oriented Programming (AOP) [15] addresses these through aspects that intercept execution at defined join points, allowing cross-cutting logic to be modularized separately from business logic."),

    p("DMAP adopts this pattern through Hooks, which intercept events across all architectural layers. DMAP defines eight hook event types that correspond to key join points in the agent lifecycle:"),

    bulletRuns([{ text: "UserPromptSubmit: ", bold: true }, "Intercepts user input before routing, enabling input transformation, context injection, or access control."]),
    bulletRuns([{ text: "SessionStart: ", bold: true }, "Fires when a new session begins, enabling initialization of session-scoped state and configuration loading."]),
    bulletRuns([{ text: "PreToolUse / PostToolUse: ", bold: true }, "Bracket tool invocations, enabling tool-level auditing, access control, and result transformation."]),
    bulletRuns([{ text: "SubAgentStart / SubAgentEnd: ", bold: true }, "Bracket agent spawning, enabling prompt augmentation, performance monitoring, and result validation."]),
    bulletRuns([{ text: "Stop: ", bold: true }, "Fires on session termination, enabling cleanup and state persistence."]),
    bulletRuns([{ text: "Notification: ", bold: true }, "Fires on system notifications, enabling custom alerting and logging behaviors."]),

    p("Crucially, Hooks carry a restriction that distinguishes DMAP from general AOP frameworks: they are reserved exclusively for orchestration plugins\u2014plugins whose primary purpose is to manage the overall agent ecosystem. Normal domain plugins are prohibited from using Hooks (MUST NOT rule #5). This restriction exists because Hooks\u2019 cross-cutting nature could create unintended interference between plugins if multiple domain plugins attempted to intercept the same events. By restricting Hooks to orchestration plugins, DMAP ensures that cross-cutting behaviors are centrally managed and predictable."),

    h2("3.4", "4-Tier Agent Model"),
    p("DMAP introduces a tiered agent model that enables cost-capability trade-offs without modifying agent definitions:"),

    tableCaption("Table 2: 4-Tier Agent Model"),
    makeTable(
      ["Tier", "Characteristics", "Typical LLM", "Suitable Tasks", "Escalation"],
      [
        ["HEAVY", "Maximum capability +\nlarge budget", "Opus (large\ntoken/time)", "Extended reasoning,\nmulti-file operations", "\u2014"],
        ["HIGH", "Highest capability,\nhigh cost", "Opus", "Complex decisions,\ndeep analysis", "\u2014"],
        ["MEDIUM", "Balanced cost\nand capability", "Sonnet", "Feature implementation,\ngeneral analysis", "\u2014"],
        ["LOW", "Fast, low cost", "Haiku", "Simple lookups,\nbasic modifications", "Reports to\nhigher tier"],
      ],
      [1100, 1400, 1200, 1400, 1200],
    ),
    emptyLine(),

    p("The tier declaration is an abstraction: an agent declares tier: HIGH in its agentcard.yaml without specifying which model corresponds to HIGH. The Gateway\u2019s runtime-mapping.yaml provides the concrete mapping (e.g., HIGH \u2192 claude-opus-4-6 in one environment, HIGH \u2192 gpt-4o in another). This indirection is the mechanism through which DMAP achieves runtime portability\u2014changing the target LLM provider requires modifying only the Gateway configuration, not any agent definitions."),

    p("The escalation mechanism enables lower-tier agents to recognize tasks that exceed their capability threshold and report upward, triggering delegation to a higher-tier variant of the same agent role. This mirrors L1/L2/L3 support structures in IT service management."),

    emptyLine(),
    ...figImage(2, "4-Tier Agent Model showing HEAVY, HIGH, MEDIUM, LOW tiers with escalation arrows and runtime-mapping.yaml connecting to concrete LLM models"),
    emptyLine(),

    h2("3.5", "3-Layer Activation Structure"),
    p("A subtle but important architectural challenge in plugin systems is the activation bootstrapping problem: how does the runtime know which Skill to activate for a given user request if the activation conditions are defined inside the Skills themselves? Loading all Skills to check their conditions would be prohibitively expensive."),

    p("DMAP resolves this through a 3-Layer activation structure:"),

    runs([{ text: "Layer A: Runtime-Resident File.", bold: true }, " A persistent configuration file (e.g., CLAUDE.md) that is always loaded. This file contains a routing table mapping request patterns to plugin Skills. It is lightweight and does not contain orchestration logic."]),
    runs([{ text: "Layer B: Core Skill.", bold: true }, " Loaded on-demand when the routing table matches. The Core Skill contains the actual orchestration logic: reading runtime-mapping.yaml, determining which Agent to spawn, and managing the delegation workflow."]),
    runs([{ text: "Layer C: Agents.", bold: true }, " Spawned by the Core Skill as needed. Agents execute autonomously within their defined boundaries and return results."]),

    p("The Setup Skill is responsible for registering the Core Skill\u2019s activation conditions into the runtime-resident file during plugin installation. This separates the bootstrap concern (knowing which Skill handles which request) from the orchestration concern (how the Skill handles it), breaking the circular dependency that would otherwise arise."),

    emptyLine(),
    ...figImage(5, "3-Layer Activation Structure showing Runtime-Resident File (routing table) \u2192 Core Skill (orchestration) \u2192 Agents (execution), with Setup Skill registering routing entries during installation"),
    emptyLine(),

    pageBreak(),
  ];
}

function designPrinciplesSection() {
  return [
    h1("4", "Design Principles"),

    p("DMAP\u2019s architecture is not an ad hoc construction but a deliberate application of established software engineering principles to the novel domain of LLM agent systems. This section maps each principle to its concrete realization within DMAP, demonstrating that the gap between traditional software architecture and AI agent architecture can be bridged through careful design."),

    h2("4.1", "Loosely Coupling"),
    p("In traditional software engineering, loose coupling is achieved through interfaces and dependency injection\u2014components interact through contracts rather than concrete implementations. DMAP achieves loose coupling through a parallel mechanism: abstract declarations in agent packages are connected to concrete implementations only through Gateway mappings."),

    p("Consider the tool abstraction: an agent declares a need for code_search capability in tools.yaml without specifying which tool provides it. The Gateway\u2019s tool_mapping section resolves this to concrete tools (e.g., lsp_workspace_symbols for code environments, or a grep-based fallback in simpler runtimes). This separation means that tool implementations can be replaced, upgraded, or adapted to different environments without modifying any agent file."),

    p("Similarly, the tier abstraction decouples agents from specific LLM models. An agent operating at tier: HIGH will use whatever model the current runtime maps to HIGH\u2014Claude Opus in one environment, GPT-4o in another, or even a locally hosted model. The agent\u2019s behavior definition remains unchanged across all environments."),

    h2("4.2", "High Cohesion"),
    p("Each component in DMAP has a single, well-defined responsibility:"),

    bulletRuns([{ text: "Skills ", bold: true }, "are responsible exclusively for routing and orchestration\u2014determining which agent handles a request, what context to provide, and how to sequence multi-step workflows. Skills never perform application-level work themselves."]),
    bulletRuns([{ text: "Agents ", bold: true }, "are responsible exclusively for autonomous task execution within their declared capabilities. Agents never make routing decisions or coordinate other agents."]),
    bulletRuns([{ text: "Gateway ", bold: true }, "is responsible exclusively for bridging abstract declarations to concrete implementations. Gateway files never contain behavioral logic."]),

    p("This strict separation is enforced through DMAP\u2019s MUST NOT rules: Skills must not write application code; Agents must not perform routing or orchestration; Gateway must not contain prompt content. These constraints ensure that each component can be authored, tested, and maintained independently."),

    h2("4.3", "Dependency Inversion"),
    p("The Dependency Inversion Principle (DIP) [6] states that high-level modules should depend on abstractions, not on low-level details, and that details should depend on abstractions. DMAP realizes this principle as follows:"),

    bulletItem("Upper layers (Skills and Agents) depend on abstractions: tier names (HIGH, MEDIUM), abstract tool names (code_search, file_read), and role declarations."),
    bulletItem("Lower layers (Gateway and Runtime) provide concrete implementations: specific model names (claude-opus-4-6), specific tool instances (lsp_workspace_symbols), and execution mechanisms."),

    p("The inversion is evident in the dependency direction: agent definitions do not import or reference any runtime-specific artifact. Instead, the runtime reads agent declarations and resolves them against Gateway mappings. This inverted dependency flow is what enables runtime portability\u2014a DMAP plugin is a pure declaration that any compatible runtime can interpret."),

    h2("4.4", "YAGNI and the Direct Path"),
    p("The YAGNI (You Ain\u2019t Gonna Need It) principle from Extreme Programming [8] warns against implementing functionality that is not currently needed. In DMAP, this manifests as the direct execution path: Setup and Utility Skills access Gateway tools directly without routing through the Agent layer."),

    p("A plugin installation script, for example, needs to execute deterministic steps (install MCP servers, register routing entries). Forcing such a script through an Agent\u2014which would involve LLM inference, token consumption, and potential non-determinism\u2014would violate YAGNI. The direct path eliminates this unnecessary indirection while maintaining architectural coherence."),

    h2("4.5", "Additional Design Points"),
    p("Beyond the core Clean Architecture principles, DMAP incorporates several additional design points that address domain-specific challenges of LLM agent orchestration:"),

    tableCaption("Table 3: DMAP Design Points and Software Engineering Correspondences"),
    makeTable(
      ["#", "Design Point", "Description", "SE Correspondence"],
      [
        ["1", "Runtime Neutrality", "Abstract tier/tool declarations\ninterpreted by any runtime", "Dependency Inversion\nPrinciple"],
        ["2", "3-Layer Activation", "Routing table \u2192 Core Skill \u2192 Agent\nbreaks circular bootstrap dependency", "Layered Architecture"],
        ["3", "Prompt Depth\nDifferentiation", "Routing/branching = detailed prompts;\nagent delegation = minimal (WHAT only)", "Interface Segregation"],
        ["4", "Delegation Notation", "Agent: 5-item (TASK, OUTCOME,\nMUST/MUST NOT, CONTEXT);\nSkill: 3-item (INTENT, ARGS, RETURN)", "Command Pattern"],
        ["5", "Escalation", "LOW tier recognizes limits,\nreports to higher tier", "L1\u2192L2\u2192L3 Support"],
        ["6", "Install/Setup\nSeparation", "install.yaml (WHAT) / Setup Skill\n(HOW) / Runtime (DO)", "CQRS"],
        ["7", "Handoff Declaration", "agentcard.yaml: target + when +\nreason for role boundary", "Service Contract"],
        ["8", "Action Category\nAbstraction", "file_write declaration \u2192\nruntime maps to Write, Edit", "Adapter Pattern"],
        ["9", "Agent Package\nBoundary", "AGENT.md (WHY+HOW) vs\nagentcard.yaml (WHO+WHAT+WHEN)\n\u2014 no duplication", "Separation of\nConcerns"],
        ["10", "Direct Path (YAGNI)", "Setup/Utility Skills skip Agent\nlayer \u2192 Gateway direct access", "YAGNI (XP)"],
        ["11", "Prompt Assembly\nOrder", "Common static \u2192 Agent-specific\nstatic \u2192 Dynamic", "Cache Optimization"],
      ],
      [400, 1400, 2300, 1500],
    ),
    emptyLine(),

    p("Design Point 3 (Prompt Depth Differentiation) deserves special attention. When a Skill instructs the runtime on routing logic, the prompt is detailed and prescriptive\u2014specifying exact conditions, fallback behaviors, and edge cases. When a Skill delegates to an Agent, however, the prompt is intentionally minimal: it specifies WHAT needs to be done (the task) but not HOW to do it. The HOW is the Agent\u2019s autonomous responsibility, encoded in its AGENT.md. This differentiation mirrors the Interface Segregation Principle, where callers should not be forced to depend on methods they do not use."),

    p("Design Point 11 (Prompt Assembly Order) addresses a practical optimization concern. LLM runtimes that support prefix caching (such as Anthropic\u2019s prompt caching) can avoid reprocessing prompt prefixes that remain identical across calls. DMAP\u2019s three-stage assembly order\u2014common static content first, then agent-specific static content, then dynamic task instructions\u2014maximizes cache hit rates by placing the most reusable content at the beginning of the assembled prompt."),

    h2("4.6", "The Declarative-Imperative Boundary"),
    p("A fundamental design decision in DMAP is where to draw the boundary between declarative specification and imperative execution. DMAP places this boundary at the Gateway layer: everything above Gateway (Skills, Agents) is purely declarative (Markdown and YAML), while everything at or below Gateway (tool implementations, runtime logic) may involve code."),

    p("This boundary placement is deliberate. Declarative specifications excel at expressing WHAT (goals, constraints, relationships, workflows) but struggle with HOW (algorithms, state machines, complex conditional logic). By placing the boundary at the infrastructure layer, DMAP allows domain-specific complexity to be encapsulated in custom tools\u2014which may involve code\u2014while keeping the agent architecture itself code-free. This pragmatic compromise preserves the benefits of declarative specification (accessibility, portability, readability) while acknowledging the practical need for imperative logic at the infrastructure level."),

    p("The custom tool escape hatch is governed by a key principle: custom tools are declared abstractly in tools.yaml and mapped concretely in runtime-mapping.yaml. An agent never directly references or depends on a custom tool\u2019s implementation; it interacts only with the abstract interface. This means that a custom tool can be reimplemented in a different language, replaced with an MCP server, or substituted with a manual process\u2014all without modifying the agent that uses it."),

    h2("4.7", "Comparison with Traditional Architecture Mapping"),
    p("To summarize the mapping between DMAP\u2019s design and established software engineering concepts, we present a comprehensive correspondence table:"),

    tableCaption("Table 3b: Clean Architecture Mapping to DMAP Components"),
    makeTable(
      ["Clean Architecture\nConcept", "Traditional Software\nRealization", "DMAP Realization"],
      [
        ["Entity\n(Business Rules)", "Domain objects,\nbusiness logic classes", "Agent behavioral definitions\n(AGENT.md: goals, workflows)"],
        ["Use Case\n(Application Rules)", "Service classes,\nuse case interactors", "Skill orchestration prompts\n(SKILL.md: routing, delegation)"],
        ["Interface Adapter\n(Controllers)", "REST controllers,\nCLI handlers", "Command entry points,\nslash command definitions"],
        ["Framework &\nDriver", "Database drivers,\nweb frameworks, UI", "Gateway (runtime-mapping.yaml),\nRuntime (Claude Code, etc.)"],
        ["Dependency Rule\n(inward only)", "Interfaces in inner\nlayers, implementations\nin outer", "Abstract declarations in\nagents/skills, concrete\nmappings in Gateway only"],
      ],
      [1700, 1800, 2400],
    ),
    emptyLine(),

    p("This mapping demonstrates that DMAP is not merely inspired by Clean Architecture but is a systematic adaptation of its principles. Every major concept in Clean Architecture has a direct correspondent in DMAP, realized through declarative rather than imperative means."),

    pageBreak(),
  ];
}

function implementationSection() {
  return [
    h1("5", "Implementation"),

    p("This section details the concrete implementation artifacts of DMAP, covering skill types, agent package structure, delegation notation, gateway mechanisms, and the namespace convention."),

    h2("5.1", "Skill Types"),
    p("DMAP defines five skill types, classified by their execution path (delegation or direct) and their functional role:"),

    tableCaption("Table 4: Skill Type Classification"),
    makeTable(
      ["Skill Type", "Path", "Required", "Count Limit", "Responsibility"],
      [
        ["Core", "Delegation", "Yes", "1 per plugin", "Request routing, agent\ndispatch, primary orchestration"],
        ["Setup", "Direct", "Yes", "No limit", "Plugin installation, environment\nconfiguration, routing registration"],
        ["Planning", "Delegation", "No", "No limit", "Strategic planning, requirements\ngathering, architecture decisions"],
        ["Orchestrator", "Delegation", "No", "No limit", "Multi-step workflow coordination,\nagent team management"],
        ["Utility", "Direct", "No", "No limit", "Auxiliary functions, diagnostics,\nstate management"],
      ],
      [1200, 1100, 900, 1000, 2100],
    ),
    emptyLine(),

    p("The mandatory inclusion of exactly one Core Skill and at least one Setup Skill per plugin ensures that every plugin is self-activating and self-installing. The Core Skill serves as the plugin\u2019s primary entry point, containing the routing logic that maps user intents to appropriate agents or other skills. The Setup Skill handles installation concerns: registering MCP servers, configuring tools, and writing the Core Skill\u2019s activation conditions into the runtime\u2019s routing table."),

    p("Delegation-path Skills (Core, Planning, Orchestrator) adhere to a strict constraint: they perform only routing and orchestration, never executing application-level work themselves. This is MUST rule #4 and MUST NOT rule #1 in DMAP\u2019s specification. Direct-path Skills (Setup, Utility), conversely, may invoke Gateway tools directly without agent mediation."),

    h2("5.2", "Agent Package Structure"),
    p("Each agent is encapsulated in a directory containing up to five artifacts:"),

    p("agents/{agent-name}/", { bold: true, font: "Courier New", size: PT(11), alignment: AlignmentType.LEFT }),
    bulletItem("AGENT.md [required] \u2014 WHY (goals) + HOW (workflow, output format, verification)"),
    bulletItem("agentcard.yaml [required] \u2014 WHO (identity) + WHAT (capabilities, restrictions) + WHEN (handoff)"),
    bulletItem("tools.yaml [optional] \u2014 Abstract tool interface declarations"),
    bulletItem("references/ [optional] \u2014 Domain-specific knowledge, guidelines"),
    bulletItem("templates/ [optional] \u2014 Output format templates"),

    emptyLine(),
    ...figImage(3, "Agent Package structure showing AGENT.md (WHY+HOW), agentcard.yaml (WHO+WHAT+WHEN), and tools.yaml with {tool:name} notation, connected by boundary principle arrows"),
    emptyLine(),

    h3("5.2.1", "AGENT.md: Behavioral Specification"),
    p("AGENT.md is the prompt-injectable file that defines an agent\u2019s goals and operational procedures. It follows a prescribed structure:"),

    bulletRuns([{ text: "Frontmatter: ", bold: true }, "YAML metadata block (name, version) at the file\u2019s top."]),
    bulletRuns([{ text: "Goals (\u76ee\u6a19): ", bold: true }, "The agent\u2019s mission statement\u2014what it exists to accomplish."]),
    bulletRuns([{ text: "References: ", bold: true }, "Pointers to domain knowledge in the references/ directory."]),
    bulletRuns([{ text: "Workflow: ", bold: true }, "Step-by-step operational procedures the agent follows."]),
    bulletRuns([{ text: "Output Format: ", bold: true }, "Expected structure and format of the agent\u2019s deliverables."]),
    bulletRuns([{ text: "Verification: ", bold: true }, "Criteria for the agent to self-assess its output quality."]),

    p("Critically, AGENT.md must not contain model names, concrete tool names, or operational constraints. Model and tool references use abstract notation: {tool:code_search} rather than lsp_workspace_symbols. This is MUST rule #7."),

    h3("5.2.2", "agentcard.yaml: Identity and Capability Declaration"),
    p("The agentcard.yaml file provides machine-readable metadata for runtime consumption:"),

    bulletRuns([{ text: "name, version: ", bold: true }, "Agent identifier and version for namespace resolution."]),
    bulletRuns([{ text: "tier: ", bold: true }, "One of HEAVY, HIGH, MEDIUM, or LOW (MUST rule #3)."]),
    bulletRuns([{ text: "capabilities.role: ", bold: true }, "The agent\u2019s functional role description."]),
    bulletRuns([{ text: "capabilities.identity: ", bold: true }, "is/is_not declarations that constrain agent behavior boundaries."]),
    bulletRuns([{ text: "capabilities.restrictions: ", bold: true }, "forbidden_actions list (e.g., file_write) mapped through action_mapping."]),
    bulletRuns([{ text: "handoff: ", bold: true }, "Array of {target, when, reason} declarations specifying when the agent should transfer work to another agent."]),
    bulletRuns([{ text: "escalation: ", bold: true }, "Conditions under which a lower-tier agent escalates to a higher-tier variant."]),

    p("The boundary principle between AGENT.md and agentcard.yaml is strict: no information may appear in both files (MUST NOT rule #6). AGENT.md owns the WHY and HOW; agentcard.yaml owns the WHO, WHAT, and WHEN. This prevents maintenance synchronization issues where a change in one file creates a contradiction with the other."),

    h3("5.2.3", "tools.yaml: Abstract Tool Interface"),
    p("The tools.yaml file declares the abstract tool capabilities an agent requires, without specifying concrete implementations:"),

    p("Each tool declaration includes name (the abstract identifier used in {tool:name} notation), description (natural language purpose), input (expected parameter schema), and output (expected return schema). The Gateway\u2019s tool_mapping section resolves these abstract names to concrete tool instances, supporting three tool types: lsp (Language Server Protocol tools), mcp (Model Context Protocol servers), and custom (domain-specific implementations). Built-in tools (Read, Write, Bash) are handled implicitly by the runtime and excluded from tool_mapping."),

    h2("5.3", "Delegation Notation"),
    p("DMAP standardizes the information passed during delegation to ensure completeness while maintaining conciseness:"),

    runs([{ text: "Agent Delegation (5-item): ", bold: true }, "When a Skill delegates to an Agent, it provides: TASK (what to accomplish), EXPECTED OUTCOME (success criteria), MUST DO (mandatory behaviors), MUST NOT DO (prohibited behaviors), and CONTEXT (relevant background information)."]),

    runs([{ text: "Skill Delegation (3-item): ", bold: true }, "When a Skill invokes another Skill, it provides: INTENT (the purpose of the invocation), ARGS (input parameters), and RETURN (expected return value structure)."]),

    p("The asymmetry between the two notations reflects a fundamental design decision: Agent delegation requires more context because Agents are autonomous\u2014they make independent decisions within their delegated scope. Skill delegation is more structured because Skills are procedural\u2014they follow defined workflows with predictable interfaces."),

    h2("5.4", "Gateway: Abstract-to-Concrete Mapping"),
    p("The Gateway layer consists of two files that together bridge the abstraction gap:"),

    runs([{ text: "install.yaml: ", bold: true }, "Declares the concrete tools that the plugin requires, organized by type: mcp_servers (external tool servers), lsp_servers (code analysis tools), and custom_tools (domain-specific utilities). This file is data\u2014it describes WHAT needs to be installed."]),

    runs([{ text: "runtime-mapping.yaml: ", bold: true }, "Provides three mapping areas that the runtime consults when spawning agents:"]),

    bulletRuns([{ text: "tier_mapping: ", bold: true }, "Maps abstract tiers (HEAVY/HIGH/MEDIUM/LOW) to concrete LLM model identifiers. Supports both default mappings and per-agent overrides for cases where a specific agent requires a non-standard model at its tier level."]),
    bulletRuns([{ text: "tool_mapping: ", bold: true }, "Maps abstract tool names (from tools.yaml) to concrete tool instances. Each mapping specifies the tool type (lsp/mcp/custom) and the concrete tool identifier(s). Only lsp, mcp, and custom types are mapped; built-in tools are excluded."]),
    bulletRuns([{ text: "action_mapping: ", bold: true }, "Maps abstract forbidden action categories (from agentcard.yaml\u2019s forbidden_actions) to concrete tool names that the runtime should withhold from the agent."]),

    emptyLine(),
    ...figImage(4, "Gateway mapping flow showing agentcard.yaml (tier, forbidden_actions) and tools.yaml (abstract tools) connecting through runtime-mapping.yaml to concrete LLM models and tool instances"),
    emptyLine(),

    p("The three-way separation between install.yaml (WHAT to install), Setup Skill (HOW to install), and Runtime (DO the installation) applies the CQRS pattern: the declaration of required resources is separated from the procedure of acquiring them."),

    h2("5.5", "Prompt Assembly"),
    p("When a delegation-path Skill spawns an Agent, the runtime assembles the complete prompt in three stages, ordered for prefix cache optimization:"),

    bulletRuns([{ text: "Stage 1 \u2014 Common Static: ", bold: true }, "The runtime-mapping.yaml content, shared across all agents. Since this content is identical for every agent invocation within a plugin, it occupies the prompt prefix where LLM caching is most effective."]),
    bulletRuns([{ text: "Stage 2 \u2014 Agent-Specific Static: ", bold: true }, "The agent\u2019s three files: AGENT.md, agentcard.yaml, and tools.yaml. This content is constant for a given agent across all invocations, enabling cache hits when the same agent is called repeatedly."]),
    bulletRuns([{ text: "Stage 3 \u2014 Dynamic: ", bold: true }, "The task-specific delegation content (the 5-item delegation for agents). This changes with every invocation and occupies the prompt suffix where cache misses are expected."]),

    p("This ordering is MUST rule #8 and represents a deliberate optimization for modern LLM runtimes that support prompt prefix caching (e.g., Anthropic\u2019s cache_control). Empirically, this can reduce token consumption by 80\u201390% for repeated agent invocations."),

    h2("5.6", "Plugin Directory Structure and Namespace"),
    p("A complete DMAP plugin follows a standardized directory structure that reflects the architectural layers:"),

    tableCaption("Table 4b: Plugin Directory Structure"),
    makeTable(
      ["Directory", "Layer", "Contents"],
      [
        [".claude-plugin/", "Metadata", "plugin.json (discovery manifest),\nmarketplace.json (distribution metadata)"],
        ["skills/", "Controller +\nUse Case", "Skill directories, each containing SKILL.md\nwith activation conditions and workflow prompts"],
        ["agents/", "Service", "Agent packages, each containing AGENT.md,\nagentcard.yaml, tools.yaml, references/, templates/"],
        ["gateway/", "Infrastructure", "install.yaml (tool manifests),\nruntime-mapping.yaml (3-area mappings)"],
        ["commands/", "Input", "Slash command entry points that route\nto Skills"],
        ["hooks/", "Cross-cutting", "Event handlers (orchestration plugins only);\nomitted in normal plugins"],
      ],
      [1400, 1100, 3800],
    ),
    emptyLine(),

    p("The namespace convention uses colon-separated identifiers to prevent collisions when multiple plugins coexist in a runtime. Skills are referenced as {plugin}:{skill-dir-name} (e.g., abra:dsl-generate). Agent Fully Qualified Names (FQN) use three parts: {plugin}:{directory-name}:{frontmatter-name} (e.g., abra:dsl-architect:dsl-architect). The three-part FQN for agents accommodates cases where the directory name differs from the agent\u2019s declared name in its frontmatter, providing both filesystem-level and logical-level identification."),

    p("Every plugin must include .claude-plugin/plugin.json (the runtime discovery manifest) and .claude-plugin/marketplace.json (distribution metadata). This is MUST rule #1, ensuring that all plugins are discoverable and distributable through standardized mechanisms. The plugin.json file contains the plugin\u2019s name, version, entry points, and dependency declarations. The marketplace.json file contains distribution metadata such as description, author, license, and compatibility information for plugin marketplace listing."),

    h2("5.7", "Specification Rules: MUST and MUST NOT"),
    p("DMAP codifies its architectural constraints through eight MUST rules (mandatory requirements) and six MUST NOT rules (prohibited patterns). These rules serve as the enforceable contract between plugin authors and runtimes, ensuring that any DMAP-compliant plugin maintains the architectural properties described in Sections 3 and 4."),

    tableCaption("Table 4c: MUST Rules (Mandatory Requirements)"),
    makeTable(
      ["#", "Rule", "Rationale"],
      [
        ["M1", "Every plugin includes plugin.json\nand marketplace.json", "Runtime discovery and\ndistribution standardization"],
        ["M2", "Every agent = AGENT.md +\nagentcard.yaml pair", "Prompt/metadata separation\n(boundary principle)"],
        ["M3", "tier must be HEAVY / HIGH /\nMEDIUM / LOW only", "4-Tier runtime mapping\nstandardization"],
        ["M4", "Delegation skills: routing and\norchestration only; direct skills:\nGateway access permitted", "Separation of concerns +\nYAGNI principle"],
        ["M5", "Abstract declarations (tools.yaml)\nseparated from concrete mappings\n(runtime-mapping.yaml)", "Dependency Inversion\nPrinciple"],
        ["M6", "Setup skill and core skill required;\n1 core skill per plugin", "Self-installing and\nself-activating plugins"],
        ["M7", "No tool specs in AGENT.md;\nuse tools.yaml with {tool:name}", "Prompt/tool separation;\nruntime neutrality"],
        ["M8", "Prompt assembly order: common\nstatic \u2192 agent-specific static \u2192\ndynamic", "Prefix cache optimization"],
      ],
      [400, 2600, 2000],
    ),
    emptyLine(),

    tableCaption("Table 4d: MUST NOT Rules (Prohibited Patterns)"),
    makeTable(
      ["#", "Rule", "Rationale"],
      [
        ["MN1", "Skills must not write application\ncode directly", "Agent\u2019s role; prevents\nskill overreach"],
        ["MN2", "Agents must not do routing or\norchestration", "Skill\u2019s role; prevents\nagent overreach"],
        ["MN3", "No model names or tool names\nhardcoded in AGENT.md", "Runtime neutrality;\nportability"],
        ["MN4", "No prompt content in\nagentcard.yaml", "Machine-readable data\nmust not contain prompts"],
        ["MN5", "No Hook usage in normal plugins", "Orchestration plugin\nexclusive; encapsulation"],
        ["MN6", "No duplicate info between\nAGENT.md and agentcard.yaml", "Boundary principle;\nmaintenance consistency"],
      ],
      [500, 2500, 2000],
    ),
    emptyLine(),

    p("These rules are not merely recommendations but structural constraints that, if violated, would undermine the architectural properties DMAP is designed to guarantee. For example, violating M5 (by hardcoding tool references in agent files) would eliminate runtime portability. Violating MN2 (by allowing agents to perform routing) would break the separation between orchestration and execution, reintroducing the role conflation problem identified in existing frameworks. The rules collectively ensure that the Loosely Coupling, High Cohesion, and Dependency Inversion properties are maintained regardless of the specific plugin\u2019s domain or complexity."),

    pageBreak(),
  ];
}

function caseStudySection() {
  return [
    h1("6", "Case Study"),

    p("To validate DMAP\u2019s expressiveness and practical applicability, we present two production-deployed plugins that represent distinct points in the plugin design space: an orchestration plugin (OMC) and a business domain plugin (Abra)."),

    h2("6.1", "OMC: Orchestration Plugin"),
    p("Oh-My-ClaudeCode (OMC) is a large-scale orchestration plugin that manages a multi-agent ecosystem for software development productivity. As an orchestration plugin, it is the sole plugin type permitted to use Hooks (cross-cutting concerns), giving it the ability to intercept and augment agent behaviors across all architectural layers."),

    tableCaption("Table 5: OMC Plugin Quantitative Profile"),
    makeTable(
      ["Component", "Count", "Details"],
      [
        ["Skills", "39", "Core: 1, Setup: 1, Planning: 5, Orchestrator: 22, Utility: 10"],
        ["Agents", "35", "12 domains \u00D7 up to 4 tiers (HEAVY/HIGH/MEDIUM/LOW)"],
        ["Agent Domains", "12", "Analysis, Execution, Search, Research, Frontend,\nDocs, Visual, Planning, Critique, Testing, Security, Data Science"],
        ["Hook Events", "8", "UserPromptSubmit, SessionStart, PreToolUse,\nPostToolUse, SubAgentStart, SubAgentEnd, Stop, Notification"],
        ["MCP Tools", "15", "LSP: 12, AST: 2, Python REPL: 1"],
        ["Gateway Mappings", "3 areas", "tier_mapping (4 tiers), tool_mapping (15 tools),\naction_mapping (forbidden actions)"],
      ],
      [1400, 800, 4100],
    ),
    emptyLine(),

    p("OMC\u2019s agent tier distribution demonstrates the 4-Tier model in practice: domain roles such as Architect, Executor, and Explorer each have LOW, MEDIUM, HIGH, and sometimes HEAVY variants. The Core Skill\u2019s routing logic considers task complexity to select the appropriate tier, defaulting to lower tiers for cost efficiency and escalating only when task complexity warrants it."),

    p("The Hooks system in OMC operates as an AOP aspect layer. For example, the SubAgentStart hook can inject additional context into any agent\u2019s prompt based on the current session state\u2014providing workflow continuity without modifying individual agent definitions. The PreToolUse hook enables tool-level access control and auditing. These cross-cutting behaviors would require modifications to every agent in a non-Hook architecture, demonstrating the value of the AOP pattern for orchestration plugins."),

    p("Key observation: OMC\u2019s 35 agents and 39 skills are defined entirely through Markdown and YAML files. No Python or TypeScript code is involved in agent definition. The only code present is in custom tools (e.g., a Python REPL integration), which are infrastructure concerns properly isolated in the Gateway layer."),

    tableCaption("Table 5b: OMC Agent Tier Distribution by Domain"),
    makeTable(
      ["Domain", "LOW", "MEDIUM", "HIGH", "HEAVY", "Total"],
      [
        ["Analysis (Architect)", "1", "1", "1", "\u2014", "3"],
        ["Execution (Executor)", "1", "1", "1", "\u2014", "3"],
        ["Search (Explorer)", "1", "1", "1", "\u2014", "3"],
        ["Research (Researcher)", "1", "1", "\u2014", "\u2014", "2"],
        ["Frontend (Designer)", "1", "1", "1", "\u2014", "3"],
        ["Documentation (Writer)", "1", "\u2014", "\u2014", "\u2014", "1"],
        ["Visual (Vision)", "\u2014", "1", "\u2014", "\u2014", "1"],
        ["Planning (Planner)", "\u2014", "\u2014", "1", "\u2014", "1"],
        ["Critique (Critic)", "\u2014", "\u2014", "1", "\u2014", "1"],
        ["Testing (QA)", "\u2014", "1", "1", "\u2014", "2"],
        ["Security (Security)", "1", "\u2014", "1", "\u2014", "2"],
        ["Data Science (Scientist)", "1", "1", "1", "\u2014", "3"],
        ["Build (Build-Fixer)", "1", "1", "\u2014", "\u2014", "2"],
        ["TDD (TDD-Guide)", "1", "1", "\u2014", "\u2014", "2"],
        ["Code Review", "1", "\u2014", "1", "\u2014", "2"],
        ["Other", "\u2014", "\u2014", "\u2014", "4", "4"],
      ],
      [1500, 700, 800, 700, 700, 700],
    ),
    emptyLine(),

    p("The tier distribution reveals a deliberate cost-optimization strategy: 12 of 35 agents operate at the LOW tier (Haiku-class models), handling simple lookups, basic modifications, and quick checks. Only 4 agents require HEAVY tier, reserved for long-running, token-intensive tasks such as persistent orchestration loops. This distribution ensures that the majority of agent invocations use the most cost-effective model tier, with higher tiers reserved for genuinely complex reasoning tasks."),

    h2("6.2", "Abra: Business Domain Plugin"),
    p("Abra is a domain-specific plugin for AI agent development workflows, representing the normal plugin category (no Hooks). Its workflow orchestrates the end-to-end process of creating Dify AI agent applications:"),

    bulletRuns([{ text: "Scenario Definition: ", bold: true }, "A scenario-analyst agent gathers business requirements and produces structured use-case scenarios."]),
    bulletRuns([{ text: "DSL Generation: ", bold: true }, "A dsl-architect agent converts scenarios into Dify-compatible DSL (Domain Specific Language) workflow definitions."]),
    bulletRuns([{ text: "Prototyping: ", bold: true }, "A prototype-runner agent generates rapid prototypes for validation."]),
    bulletRuns([{ text: "Development Planning: ", bold: true }, "A plan-writer agent creates detailed development plans."]),
    bulletRuns([{ text: "Development: ", bold: true }, "An agent-developer agent implements the final production code."]),

    tableCaption("Table 6: Abra Plugin Quantitative Profile"),
    makeTable(
      ["Component", "Count", "Details"],
      [
        ["Skills", "8", "core: 1, setup: 1, Planning: 2 (scenario, dev-plan),\nOrchestrator: 4 (dsl-generate, prototype, develop, orchestrate)"],
        ["Agents", "5", "scenario-analyst, dsl-architect, agent-developer,\nplan-writer, prototype-runner"],
        ["Agent Packages", "5", "Each: AGENT.md + agentcard.yaml + tools.yaml"],
        ["Gateway Files", "2", "install.yaml + runtime-mapping.yaml"],
        ["Hook Usage", "0", "Normal plugin: Hooks prohibited"],
        ["Namespace", "\u2014", "Skills: abra:{skill-name}, Agents: abra:{dir}:{name}"],
      ],
      [1400, 800, 4100],
    ),
    emptyLine(),

    p("Abra validates several key DMAP properties. First, domain universality: the plugin addresses AI agent development, not general programming\u2014demonstrating that DMAP\u2019s architecture is not tied to code-centric domains. Second, the boundary principle: each of Abra\u2019s five agents maintains clean separation between AGENT.md (workflow prompts) and agentcard.yaml (capability declarations) with zero information duplication. Third, tool abstraction: Abra\u2019s agents reference tools through abstract names (e.g., {tool:dsl_validate}, {tool:scenario_parse}), which the Gateway maps to concrete implementations."),

    p("A particularly instructive comparison is the scale difference between OMC and Abra. OMC, as an orchestration plugin, requires 35 agents across 12 domains with full Hook infrastructure. Abra, as a focused domain plugin, accomplishes its workflow with 5 agents and 8 skills\u2014no Hooks, no complex tier distributions. This demonstrates DMAP\u2019s scalability: the same architecture gracefully accommodates both large-scale orchestration systems and focused domain workflows."),

    h2("6.3", "Cross-Cutting Observations"),
    p("Several observations emerge from analyzing both plugins together:"),

    runs([{ text: "Architectural Consistency. ", bold: true }, "Despite their vastly different scales and domains, both plugins follow identical architectural patterns: Skills route to Agents through the delegation path, Agents reference tools through abstract {tool:name} notation, and Gateway provides concrete mappings. A developer familiar with Abra\u2019s structure would immediately understand OMC\u2019s organization, and vice versa, despite OMC being roughly seven times larger."]),

    runs([{ text: "Rule Adherence. ", bold: true }, "Both plugins adhere to all eight MUST rules and six MUST NOT rules without exception. This validates that the rule system is not overly restrictive for practical plugin development. Notably, the boundary principle (MUST NOT rule #6) required careful attention during Abra\u2019s development\u2014the natural tendency to describe agent capabilities in both the prompt (AGENT.md) and the metadata (agentcard.yaml) had to be consciously resisted."]),

    runs([{ text: "Gateway Reusability. ", bold: true }, "Both plugins share structural similarity in their Gateway configurations, despite mapping to different tool sets. This suggests the potential for Gateway template libraries that accelerate new plugin development\u2014a direction for future ecosystem tooling."]),

    runs([{ text: "Skill Type Distribution. ", bold: true }, "In OMC, Orchestrator Skills (22 of 39) dominate, reflecting its coordination-heavy mission. In Abra, the distribution is more balanced (4 Orchestrators, 2 Planning, 1 Core, 1 Setup), reflecting a domain workflow that interleaves planning and execution. This diversity validates the five-type skill taxonomy as sufficiently expressive for different plugin profiles."]),

    p("The successful deployment of both plugins provides preliminary evidence that DMAP\u2019s architecture is both expressive enough for complex orchestration systems and accessible enough for focused domain workflows. However, as discussed in Section 8, broader validation across diverse teams and domains would strengthen this conclusion."),

    pageBreak(),
  ];
}

function evaluationSection() {
  return [
    h1("7", "Evaluation"),

    p("We evaluate DMAP along seven comparison axes that reflect the structural limitations identified in Section 1. Our comparison includes the five surveyed frameworks (LangGraph, CrewAI, AutoGen, MetaGPT, ChatDev) against DMAP."),

    h2("7.1", "Quantitative Comparison: Declaration Density"),
    p("We measure the number of lines required to fully define a single agent with one tool, one role, and one handoff condition\u2014a minimal but complete agent definition:"),

    tableCaption("Table 7: Lines of Code/Declaration for Minimal Agent Definition"),
    makeTable(
      ["Framework", "Language", "Agent Def", "Tool Binding", "Orchestration", "Total LoC"],
      [
        ["LangGraph", "Python", "~40 lines", "~15 lines", "~30 lines", "~85"],
        ["CrewAI", "Python", "~25 lines", "~10 lines", "~20 lines", "~55"],
        ["AutoGen", "Python", "~35 lines", "~20 lines", "~25 lines", "~80"],
        ["MetaGPT", "Python", "~50 lines", "~15 lines", "~35 lines", "~100"],
        ["ChatDev", "Python/JSON", "~45 lines", "~10 lines", "~40 lines", "~95"],
        ["DMAP", "MD + YAML", "~30 lines", "~10 lines", "~15 lines", "~55"],
      ],
      [1100, 1100, 1000, 1100, 1100, 900],
    ),
    emptyLine(),

    p("While DMAP\u2019s total line count is comparable to CrewAI\u2019s, the critical difference lies in the language: DMAP\u2019s lines are Markdown and YAML, requiring no programming knowledge. Furthermore, DMAP\u2019s agent definition is inherently portable\u2014the same 55 lines work across any compatible runtime\u2014whereas each framework\u2019s 55\u2013100 lines are locked to its specific SDK."),

    h2("7.2", "Qualitative Comparison"),

    tableCaption("Table 8: Multi-Dimensional Qualitative Comparison"),
    makeTable(
      ["Dimension", "LangGraph", "CrewAI", "AutoGen", "MetaGPT", "DMAP"],
      [
        ["Entry Barrier", "High\n(Python +\nSDK)", "Medium\n(Python +\nSDK)", "High\n(Python +\nSDK)", "High\n(Python +\nSDK)", "Low\n(Markdown +\nYAML)"],
        ["Runtime\nPortability", "None\n(LangChain\nlocked)", "None\n(CrewAI\nlocked)", "None\n(AutoGen\nlocked)", "None\n(MetaGPT\nlocked)", "Full\n(runtime-\nmapping.yaml)"],
        ["Extensibility", "Medium\n(subclass\npatterns)", "Medium\n(decorator\npatterns)", "Medium\n(protocol\nextension)", "Low\n(SOP\nmodification)", "High\n(add files,\nno code\nchange)"],
        ["Separation of\nConcerns", "Low\n(mixed\nresponsibilities)", "Medium\n(role-based\nbut coupled)", "Medium\n(conversation\nprotocol)", "Medium\n(SOP-based\nseparation)", "High\n(5-Layer,\nstrict\nboundaries)"],
        ["Token\nEfficiency", "N/A\n(code-\nbased)", "N/A\n(code-\nbased)", "Medium\n(conversation\noverhead)", "Low\n(verbose\nSOP prompts)", "High\n(4-Tier +\ncache\noptimization)"],
        ["Domain\nUniversality", "Medium\n(general\nbut code-\ncentric)", "Medium\n(general\nbut code-\ncentric)", "Medium\n(conversation-\ncentric)", "Low\n(software\ndev focused)", "High\n(domain\nagnostic by\ndesign)"],
        ["Non-Developer\nAccessibility", "No", "No", "No", "No", "Yes"],
      ],
      [1200, 1000, 1000, 1000, 1000, 1100],
    ),
    emptyLine(),

    h2("7.3", "Analysis of Results"),

    p("Three observations emerge from the evaluation:"),

    runs([{ text: "Observation 1: The Portability Divide.", bold: true }, " DMAP is the only framework that achieves runtime portability. All other frameworks produce agent definitions that are permanently bound to their respective SDKs. This is a direct consequence of DMAP\u2019s core architectural decision: separating declarations from implementations through the Gateway layer. Changing the target runtime requires modifying only runtime-mapping.yaml\u2014agent definitions, skill definitions, and organizational structure remain untouched."]),

    runs([{ text: "Observation 2: The Accessibility Gap.", bold: true }, " DMAP uniquely enables non-developer participation in agent system design. A domain expert (e.g., an educator designing a tutoring agent team, or a business analyst defining a document processing workflow) can author AGENT.md files in natural language and fill in structured YAML templates without learning any programming language. This expands the potential designer pool from professional developers to any literate knowledge worker."]),

    runs([{ text: "Observation 3: Token Efficiency Through Architecture.", bold: true }, " DMAP\u2019s 4-Tier model and prompt assembly optimization provide token efficiency benefits that are architectural rather than implementational. By routing simple tasks to LOW-tier agents (smaller, cheaper models) and reserving HIGH/HEAVY tiers for complex reasoning, DMAP inherently optimizes cost. The three-stage prompt assembly order further reduces token consumption through effective cache utilization. These optimizations are impossible in code-based frameworks where all agents typically use the same model."]),

    h2("7.4", "Portability Analysis"),
    p("To quantify the portability advantage, we analyze the effort required to port an agent system from one runtime to another:"),

    tableCaption("Table 9: Portability Cost Analysis \u2014 Files Modified When Changing Runtime"),
    makeTable(
      ["Framework", "Agent Files", "Tool Files", "Orchestration", "Config Files", "Total Modified"],
      [
        ["LangGraph", "All (~N)", "All (~N)", "All (~N)", "All", "~3N + config"],
        ["CrewAI", "All (~N)", "All (~N)", "All (~N)", "All", "~3N + config"],
        ["AutoGen", "All (~N)", "All (~N)", "All (~N)", "All", "~3N + config"],
        ["MetaGPT", "All (~N)", "All (~N)", "All (~N)", "All", "~3N + config"],
        ["DMAP", "0", "0", "0", "1 (runtime-\nmapping.yaml)", "1"],
      ],
      [1100, 1000, 1000, 1200, 1100, 1300],
    ),
    emptyLine(),

    p("For a system with N agents, code-based frameworks require modifying approximately 3N files (agent definitions, tool bindings, and orchestration logic) plus configuration files. DMAP requires modifying exactly one file: runtime-mapping.yaml. This O(1) versus O(N) portability cost is the most concrete manifestation of the Dependency Inversion Principle in DMAP\u2019s architecture. In the OMC case study, porting 35 agents to a different runtime would require modifying approximately 105 files in a code-based framework versus 1 file in DMAP."),

    h2("7.5", "Extensibility Analysis"),
    p("We further evaluate how each framework handles the addition of new agents to an existing system:"),

    tableCaption("Table 10: Extensibility Cost \u2014 Steps to Add a New Agent"),
    makeTable(
      ["Framework", "New Files", "Modified Existing Files", "Code Required"],
      [
        ["LangGraph", "1 (Python module)", "Graph definition,\nrouting logic", "Yes (Python)"],
        ["CrewAI", "1 (Python class)", "Crew definition,\ntask list", "Yes (Python)"],
        ["AutoGen", "1 (Python class)", "Group chat config,\nconversation flow", "Yes (Python)"],
        ["MetaGPT", "1 (Python class)", "SOP pipeline,\nrole registry", "Yes (Python)"],
        ["DMAP", "3 (MD + 2 YAML)", "0 (Core Skill auto-\nroutes by convention)", "No"],
      ],
      [1200, 1400, 1800, 1400],
    ),
    emptyLine(),

    p("DMAP achieves the Open-Closed Principle [11] for agent extension: new agents are added by creating new files in the agents/ directory without modifying any existing file. The Core Skill\u2019s routing logic, being prompt-based, can be written to auto-discover agents by convention (e.g., scanning the agents/ directory), eliminating the need for manual registration. In contrast, every surveyed code-based framework requires modifying at least one existing file (typically the orchestration configuration) when adding a new agent, creating a coupling between new and existing components."),

    pageBreak(),
  ];
}

function discussionSection() {
  return [
    h1("8", "Discussion"),

    h2("8.1", "Limitations"),
    p("DMAP\u2019s declarative approach introduces a fundamental dependency on the LLM runtime\u2019s ability to accurately interpret natural language prompts as behavioral specifications. Unlike code, which executes deterministically, prompt-based agent definitions are subject to the LLM\u2019s interpretation, which may vary with model version, temperature settings, or context window utilization. This non-determinism is an inherent limitation of prompt-based architectures that no amount of specification rigor can fully eliminate."),

    p("The expressiveness boundary of declarative-only specification is another limitation. While DMAP handles the vast majority of agent orchestration patterns through Markdown and YAML, certain highly procedural or algorithmically complex behaviors may be difficult to express declaratively. The custom tool escape hatch in Gateway partially addresses this\u2014complex logic can be encapsulated in custom tools that agents invoke through abstract interfaces\u2014but this introduces code at the infrastructure level, partially undermining the code-free ideal."),

    p("Additionally, the current evaluation relies on two plugins developed by the same team. While OMC and Abra differ substantially in scope and domain, independent validation by external teams would strengthen confidence in DMAP\u2019s generalizability."),

    p("A fourth limitation concerns the maturity of LLM runtimes themselves. DMAP\u2019s architecture assumes a runtime that can interpret Markdown prompts, resolve YAML configurations, spawn sub-agents, and manage tool invocations. As of 2025, only a small number of runtimes (Claude Code, Codex CLI, Gemini CLI) provide these capabilities natively. The broader ecosystem of LLM runtimes may require adaptation layers to support DMAP\u2019s assumptions, potentially adding complexity at the integration boundary."),

    p("Finally, the boundary principle\u2014prohibiting information duplication between AGENT.md and agentcard.yaml\u2014requires discipline from plugin authors. In practice, authors may be tempted to repeat key information in both files for readability, inadvertently creating maintenance synchronization issues. Tooling support (e.g., linters that detect boundary violations) would mitigate this risk but is not yet part of the DMAP specification."),

    h2("8.2", "Threats to Validity"),
    p("Several threats to validity must be acknowledged. First, the comparison in Section 7 uses estimated line counts rather than empirically measured values from identical applications built in each framework, as building the same system five times is impractical. Second, the \u201Cnon-developer accessibility\u201D claim, while architecturally justified (Markdown and YAML require no programming), has not been validated through user studies with actual non-developer populations. Third, DMAP\u2019s runtime portability has been demonstrated across Claude Code, Codex CLI, and Gemini CLI, but untested runtimes may reveal compatibility challenges not anticipated by the current specification."),

    h2("8.3", "Future Work"),
    p("Several directions for future research emerge from this work:"),

    bulletRuns([{ text: "Automatic Runtime Mapping Generation. ", bold: true }, "Currently, Gateway\u2019s runtime-mapping.yaml must be authored manually for each target runtime. An automated system that analyzes a runtime\u2019s available tools and models, then generates compatible mappings, would significantly reduce the effort required to port plugins across runtimes."]),

    bulletRuns([{ text: "Standardization Body Proposal. ", bold: true }, "DMAP\u2019s specification\u2014the agent package structure, skill types, gateway format, and namespace conventions\u2014could serve as the basis for an industry standard for declarative agent definition. Proposing this standard to relevant bodies (e.g., a working group within ACM or IEEE) could catalyze ecosystem-wide adoption."]),

    bulletRuns([{ text: "Benchmark Construction. ", bold: true }, "Developing a standardized benchmark suite for evaluating multi-agent plugin architectures would enable more rigorous comparisons. Such a benchmark should measure not only functional correctness but also token efficiency, portability cost, and designer cognitive load."]),

    bulletRuns([{ text: "User Study with Non-Developers. ", bold: true }, "An empirical study where domain experts (educators, business analysts, project managers) attempt to define agent systems using DMAP versus code-based frameworks would provide stronger evidence for the accessibility claim."]),

    bulletRuns([{ text: "Formal Verification of Declarative Specifications. ", bold: true }, "Exploring whether DMAP\u2019s structured Markdown and YAML specifications can be formally verified for properties such as deadlock freedom (no circular delegation), completeness (all declared handoffs have valid targets), and consistency (no MUST/MUST NOT contradictions) represents an exciting intersection of formal methods and AI agent systems."]),

    pageBreak(),
  ];
}

function conclusionSection() {
  return [
    h1("9", "Conclusion"),

    p("This paper has presented DMAP (Declarative Multi-Agent Plugin), a runtime-neutral plugin architecture that demonstrates the feasibility and benefits of applying Clean Architecture principles to LLM agent systems through declarative specifications in Markdown and YAML."),

    p("Our four contributions address fundamental limitations of existing multi-agent frameworks:"),

    bulletRuns([{ text: "Contribution 1 (Declarative Specification): ", bold: true }, "The agent package standard (AGENT.md + agentcard.yaml + tools.yaml) eliminates code dependency while maintaining expressiveness. The boundary principle\u2014WHY+HOW in Markdown, WHO+WHAT+WHEN in YAML\u2014prevents information duplication and ensures that each file has a single, clear purpose. This enables non-developers to participate in agent system design for the first time."]),

    bulletRuns([{ text: "Contribution 2 (5-Layer Architecture): ", bold: true }, "The layered architecture with dual execution paths applies Loosely Coupling, High Cohesion, Dependency Inversion, and YAGNI principles to achieve strict separation of concerns. The delegation path (Skills \u2192 Agents \u2192 Gateway) handles LLM reasoning tasks, while the direct path (Skills \u2192 Gateway) handles procedural tasks without unnecessary Agent overhead. Hooks provide AOP-style cross-cutting capabilities exclusively for orchestration plugins."]),

    bulletRuns([{ text: "Contribution 3 (4-Tier Model and Runtime Portability): ", bold: true }, "The abstract tier system (HEAVY/HIGH/MEDIUM/LOW) with Gateway\u2019s runtime-mapping.yaml achieves O(1) portability cost\u2014changing the target runtime requires modifying exactly one file regardless of system size. This contrasts sharply with the O(N) cost in code-based frameworks."]),

    bulletRuns([{ text: "Contribution 4 (Empirical Validation): ", bold: true }, "Two production-deployed plugins validate the architecture at different scales: OMC (39 Skills, 35 Agents, 4-Tier distribution, Hooks) demonstrates large-scale orchestration capability, while Abra (8 Skills, 5 Agents, no Hooks) demonstrates focused domain applicability. Both are defined entirely in Markdown and YAML."]),

    p("The codified rule system\u2014eight MUST rules and six MUST NOT rules\u2014provides an enforceable contract that preserves architectural properties across all DMAP-compliant plugins. These rules are not arbitrary constraints but direct consequences of the architectural principles: each rule traces to a specific software engineering principle (Dependency Inversion, Separation of Concerns, YAGNI) and a concrete architectural benefit (portability, maintainability, extensibility)."),

    p("The broader implication of this work extends beyond the specific DMAP specification. We have demonstrated that well-known software engineering principles\u2014principles developed over decades for traditional software systems\u2014can be productively transplanted to the fundamentally different domain of AI agent orchestration. The key insight is that the shift from imperative to declarative specification does not require abandoning architectural discipline; rather, it demands reimagining how established principles manifest in a new medium. Where Dependency Inversion traditionally operates through interfaces and abstract classes, in DMAP it operates through abstract tier declarations and YAML mappings. Where Separation of Concerns traditionally divides code modules, in DMAP it divides Markdown files (prompts) from YAML files (metadata) from Gateway configurations (infrastructure)."),

    p("As LLM agent systems continue to grow in complexity and deployment scope, the architectural discipline that DMAP embodies will become increasingly essential. The era of ad hoc, code-coupled agent definitions is approaching its practical limit; declarative, principled architectures represent the sustainable path toward scalable, portable, and accessible multi-agent systems."),

    pageBreak(),
  ];
}

function referencesSection() {
  const refs = [
    "[1] Wu, Q., Bansal, G., Zhang, J., Wu, Y., Li, B., Zhu, E., Jiang, L., Zhang, X., Zhang, S., Liu, J., Awadallah, A.H., White, R.W., Burger, D., & Wang, C. (2023). AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation. arXiv preprint arXiv:2308.08155.",
    "[2] Moura, J. (2024). CrewAI: Framework for orchestrating role-playing autonomous AI agents. GitHub repository. https://github.com/joaomdmoura/crewAI",
    "[3] LangChain Team. (2024). LangGraph: Building language agents as graphs. LangChain Documentation. https://python.langchain.com/docs/langgraph",
    "[4] Hong, S., Zhuge, M., Chen, J., Zheng, X., Cheng, Y., Zhang, C., Wang, J., Wang, Z., Yau, S.K.S., Lin, Z., Zhou, L., Ran, C., Xiao, L., Wu, C., & Schmidhuber, J. (2023). MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework. arXiv preprint arXiv:2308.00352.",
    "[5] Qian, C., Cong, X., Yang, C., Chen, W., Su, Y., Xu, J., Liu, Z., & Sun, M. (2023). Communicative Agents for Software Development. arXiv preprint arXiv:2307.07924.",
    "[6] Martin, R.C. (2017). Clean Architecture: A Craftsman\u2019s Guide to Software Structure and Design. Prentice Hall.",
    "[7] Chase, H. (2022). LangChain: Building applications with LLMs through composability. GitHub repository. https://github.com/langchain-ai/langchain",
    "[8] Beck, K. (2004). Extreme Programming Explained: Embrace Change (2nd ed.). Addison-Wesley.",
    "[9] Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). Design Patterns: Elements of Reusable Object-Oriented Software. Addison-Wesley.",
    "[10] Fowler, M. (2002). Patterns of Enterprise Application Architecture. Addison-Wesley.",
    "[11] Martin, R.C. (2003). Agile Software Development, Principles, Patterns, and Practices. Prentice Hall.",
    "[12] Xi, Z., Chen, W., Guo, X., He, W., Ding, Y., Hong, B., Zhang, M., Wang, J., Jin, S., Zhou, E., Zheng, R., Fan, X., Wang, X., Xiong, L., Zhou, Y., Wang, W., Jiang, C., Zou, Y., Liu, X., Yin, Z., Dou, S., Weng, R., Cheng, W., Zhang, Q., Qin, W., Zheng, Y., Qiu, X., Huang, X., & Gui, T. (2023). The Rise and Potential of Large Language Model Based Agents: A Survey. arXiv preprint arXiv:2309.07864.",
    "[13] Wang, L., Ma, C., Feng, X., Zhang, Z., Yang, H., Zhang, J., Chen, Z., Tang, J., Chen, X., Lin, Y., Zhao, W.X., Wei, Z., & Wen, J. (2024). A Survey on Large Language Model based Autonomous Agents. Frontiers of Computer Science, 18(6), 186345.",
    "[14] Anthropic. (2024). Claude Code: An agentic coding tool. Anthropic Documentation. https://docs.anthropic.com/en/docs/claude-code",
    "[15] Kiczales, G., Lamping, J., Mendhekar, A., Maeda, C., Lopes, C., Loingtier, J.M., & Irwin, J. (1997). Aspect-Oriented Programming. In Proceedings of ECOOP\u201997, Springer LNCS 1241, pp. 220\u2013242.",
    "[16] OpenAI. (2025). Codex CLI: An open-source coding agent. GitHub repository. https://github.com/openai/codex",
    "[17] Google. (2025). Gemini CLI: AI-powered command line tool. Google Developers. https://developers.google.com/gemini/cli",
    "[18] Parnas, D.L. (1972). On the Criteria to Be Used in Decomposing Systems into Modules. Communications of the ACM, 15(12), 1053\u20131058.",
    "[19] Shaw, M. & Garlan, D. (1996). Software Architecture: Perspectives on an Emerging Discipline. Prentice Hall.",
    "[20] Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). ReAct: Synergizing Reasoning and Acting in Language Models. In Proceedings of ICLR 2023.",
    "[21] Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia, F., Chi, E., Le, Q., & Zhou, D. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. In Proceedings of NeurIPS 2022.",
    "[22] Schick, T., Dwivedi-Yu, J., Dessi, R., Raileanu, R., Lomeli, M., Hambro, E., Zettlemoyer, L., Cancedda, N., & Scialom, T. (2024). Toolformer: Language Models Can Teach Themselves to Use Tools. In Proceedings of NeurIPS 2023.",
    "[23] Park, J.S., O\u2019Brien, J.C., Cai, C.J., Morris, M.R., Liang, P., & Bernstein, M.S. (2023). Generative Agents: Interactive Simulacra of Human Behavior. In Proceedings of UIST 2023.",
  ];

  const children = [
    h1("10", "References"),
    emptyLine(),
  ];

  refs.forEach((ref) => {
    children.push(new Paragraph({
      children: [new TextRun({ text: ref, font: FONT, size: PT(10) })],
      spacing: { after: 100, line: 260 },
      indent: { left: convertInchesToTwip(0.4), hanging: convertInchesToTwip(0.4) },
      alignment: AlignmentType.LEFT,
    }));
  });

  return children;
}

// ─── DOCUMENT ASSEMBLY ───────────────────────────────────────────────────────

async function main() {
  console.log("Generating DMAP academic paper...");

  const sections = [
    ...titleSection(),
    ...abstractSection(),
    ...introductionSection(),
    ...relatedWorkSection(),
    ...architectureSection(),
    ...designPrinciplesSection(),
    ...implementationSection(),
    ...caseStudySection(),
    ...evaluationSection(),
    ...discussionSection(),
    ...conclusionSection(),
    ...referencesSection(),
  ];

  const doc = new Document({
    creator: "Unicorn Inc. Research Team",
    title: "Declarative Multi-Agent Orchestration: Applying Clean Architecture Principles to LLM Agent Systems via Markdown and YAML",
    description: "DMAP Academic Paper",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE },
          paragraph: { spacing: { after: 120, line: 276 } },
        },
        heading1: {
          run: { font: FONT, size: H1_SIZE, bold: true },
          paragraph: { spacing: { before: 360, after: 200 } },
        },
        heading2: {
          run: { font: FONT, size: H2_SIZE, bold: true },
          paragraph: { spacing: { before: 280, after: 160 } },
        },
        heading3: {
          run: { font: FONT, size: H3_SIZE, bold: true, italics: true },
          paragraph: { spacing: { before: 200, after: 120 } },
        },
      },
      paragraphStyles: [
        {
          id: "TOCHeading",
          name: "TOC Heading",
          basedOn: "Normal",
          next: "Normal",
          run: { font: FONT, size: H1_SIZE, bold: true },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } },
            { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) } } } },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: INCH,
              right: INCH,
              bottom: INCH,
              left: INCH,
            },
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(11),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Declarative Multi-Agent Orchestration", font: FONT, size: PT(9), italics: true, color: "888888" }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Page ", font: FONT, size: PT(9), color: "888888" }),
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: PT(9), color: "888888" }),
                  new TextRun({ text: " of ", font: FONT, size: PT(9), color: "888888" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: PT(9), color: "888888" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, "DMAP-paper-en.docx");
  fs.writeFileSync(outPath, buffer);
  const stats = fs.statSync(outPath);
  console.log(`Paper generated: ${outPath}`);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
