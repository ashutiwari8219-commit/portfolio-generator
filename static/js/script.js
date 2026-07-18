(() => {
  "use strict";

  const form = document.getElementById("builder-form");
  const projectList = document.getElementById("project-list");
  const rowTemplate = document.getElementById("project-row-template");
  const addProjectBtn = document.getElementById("add-project");
  const skillsInput = document.getElementById("f-skills");
  const skillsPreview = document.getElementById("skills-preview");
  const revBadge = document.getElementById("rev-badge");
  const statusMsg = document.getElementById("status-msg");
  const generateBtn = document.getElementById("generate-btn");
  const previewBtn = document.getElementById("preview-btn");

  let revCount = 1;
  let revTimer = null;

  // ---------- helpers ----------
  const splitList = (str) =>
    (str || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  function bumpRev() {
    clearTimeout(revTimer);
    revCount += 1;
    revBadge.textContent = `REV ${String(revCount).padStart(2, "0")}`;
    revBadge.classList.add("bump");
    revTimer = setTimeout(() => revBadge.classList.remove("bump"), 400);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  // ---------- project rows ----------
  function addProjectRow() {
    const frag = rowTemplate.content.cloneNode(true);
    projectList.appendChild(frag);
    renumberProjects();
    updatePreview();
  }

  function renumberProjects() {
    [...projectList.querySelectorAll(".project-row")].forEach((row, i) => {
      row.querySelector(".project-row-num").textContent =
        `PROJECT ${String(i + 1).padStart(2, "0")}`;
    });
  }

  projectList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-project")) {
      e.target.closest(".project-row").remove();
      renumberProjects();
      updatePreview();
      bumpRev();
    }
  });

  addProjectBtn.addEventListener("click", () => {
    addProjectRow();
    bumpRev();
  });

  // ---------- collect form state ----------
  function collectData() {
    const projects = [...projectList.querySelectorAll(".project-row")].map((row) => ({
      name: row.querySelector(".p-name").value.trim(),
      description: row.querySelector(".p-desc").value.trim(),
      link: row.querySelector(".p-link").value.trim(),
      tags: splitList(row.querySelector(".p-tags").value),
    })).filter((p) => p.name);

    const theme = form.querySelector('input[name="theme"]:checked').value;

    return {
      name: document.getElementById("f-name").value.trim(),
      role: document.getElementById("f-role").value.trim(),
      bio: document.getElementById("f-bio").value.trim(),
      email: document.getElementById("f-email").value.trim(),
      github: document.getElementById("f-github").value.trim(),
      linkedin: document.getElementById("f-linkedin").value.trim(),
      website: document.getElementById("f-website").value.trim(),
      skills: splitList(skillsInput.value),
      projects,
      theme,
    };
  }

  // ---------- live preview (blueprint-style mockup, DOM only) ----------
  function updatePreview() {
    const data = collectData();

    document.getElementById("pv-name").textContent = data.name || "Your Name";
    document.getElementById("pv-role").textContent = data.role;
    document.getElementById("pv-bio").textContent = data.bio;

    const skillsLabel = document.getElementById("pv-skills-label");
    const skillsEl = document.getElementById("pv-skills");
    skillsEl.innerHTML = "";
    if (data.skills.length) {
      skillsLabel.hidden = false;
      data.skills.forEach((s) => {
        const span = document.createElement("span");
        span.textContent = s;
        skillsEl.appendChild(span);
      });
    } else {
      skillsLabel.hidden = true;
    }

    const projectsEl = document.getElementById("pv-projects");
    projectsEl.innerHTML = "";
    if (data.projects.length) {
      data.projects.forEach((p) => {
        const div = document.createElement("div");
        div.className = "pv-project";
        div.innerHTML = `<h4>${escapeHtml(p.name)}</h4>${
          p.description ? `<p>${escapeHtml(p.description)}</p>` : ""
        }`;
        projectsEl.appendChild(div);
      });
    } else {
      projectsEl.innerHTML = '<p class="pv-empty">Projects you add will draft in here.</p>';
    }

    // skill chips echoed under the skills field too
    skillsPreview.innerHTML = "";
    data.skills.forEach((s) => {
      const span = document.createElement("span");
      span.className = "chip";
      span.textContent = s;
      skillsPreview.appendChild(span);
    });

    document.getElementById("preview-theme-label").textContent =
      data.theme === "mono" ? "MINIMAL" : "BLUEPRINT";
  }

  // ---------- wire up live updates ----------
  form.addEventListener("input", (e) => {
    updatePreview();
    if (e.target.name !== "theme") bumpRev();
  });
  form.addEventListener("change", (e) => {
    if (e.target.name === "theme") updatePreview();
  });

  // ---------- status helper ----------
  function setStatus(text, kind) {
    statusMsg.textContent = text;
    statusMsg.className = "status-msg" + (kind ? ` ${kind}` : "");
  }

  // ---------- generate & download ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = collectData();

    if (!data.name) {
      setStatus("Add a name before generating.", "err");
      document.getElementById("f-name").focus();
      return;
    }

    generateBtn.disabled = true;
    setStatus("Rendering your portfolio…");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.href = url;
      a.download = match ? match[1] : "portfolio.html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus("Downloaded — open the file in any browser.", "ok");
    } catch (err) {
      console.error(err);
      setStatus("Couldn't generate the file. Try again.", "err");
    } finally {
      generateBtn.disabled = false;
    }
  });

  // ---------- open full preview in new tab ----------
  previewBtn.addEventListener("click", async () => {
    const data = collectData();
    setStatus("Opening preview…");
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setStatus("");
      } else {
        setStatus("Allow pop-ups to preview in a new tab.", "err");
      }
    } catch (err) {
      console.error(err);
      setStatus("Couldn't load preview. Try again.", "err");
    }
  });

  // ---------- init ----------
  addProjectRow();
  updatePreview();
})();
